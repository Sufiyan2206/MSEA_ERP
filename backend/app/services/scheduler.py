"""Automation jobs (APScheduler, in-process). In production run ONE worker with
SCHEDULER_ENABLED=1 (the `scheduler` service in docker-compose) and the web
workers with SCHEDULER_ENABLED=0, otherwise jobs run once per gunicorn worker.

Jobs:
  06:00  gap_scan             – detectors + escalation + reminders
  07:00  daily_brief_email    – brief to management roles (EmailLog, simulated)
  18:30  cash_close_reminder  – cashiers with cash receipts today and no closing
  every 15 min scheduled_reports – ReportDefinition.schedule {"hour": H, "weekday": [0-6]|null}
"""
import logging
from datetime import date, datetime

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.db import session_scope

log = logging.getLogger("msea.scheduler")


def job_gap_scan(app):
    with app.app_context(), session_scope() as s:
        from app.services.gap_engine import scan
        cfg = {"ATTENDANCE_MIN_PCT": app.config["ATTENDANCE_MIN_PCT"], "DAILY_TARGET_PCT": app.config["DAILY_TARGET_PCT"]}
        log.info("gap scan: %s", scan(s, cfg))


def job_daily_brief(app):
    with app.app_context(), session_scope() as s:
        from app.models import Role, User
        from app.services.brief import daily_brief
        from app.services.notify import notify_users, queue_email
        b = daily_brief(s, None)
        mgmt = s.query(User).join(Role).filter(Role.name.in_(["CEO", "CFO", "COO", "Regional Head", "Internal Auditor"]), User.status == "Active").all()
        notify_users(s, [u.id for u in mgmt], b["headline"], route="/dashboard", kind="brief")
        for u in mgmt:
            if u.email:
                queue_email(s, u.email, f"MSEA daily brief {b['kpis']['date']}", b["headline"] + "\n\n" + "\n".join(b["flags"]), trigger="daily_brief")


def job_cash_close_reminder(app):
    with app.app_context(), session_scope() as s:
        from sqlalchemy import func
        from app.models import CashierClosing, Receipt
        from app.services.notify import notify_users
        today = date.today()
        rows = s.query(Receipt.branch_id, Receipt.cashier_id, func.sum(Receipt.total)).filter(Receipt.receipt_date == today, Receipt.mode == "Cash", Receipt.status == "Paid").group_by(Receipt.branch_id, Receipt.cashier_id).all()
        for bid, cid, amt in rows:
            if not s.query(CashierClosing).filter_by(branch_id=bid, cashier_id=cid, closing_date=today).first():
                notify_users(s, [cid], f"Reminder: close your cash day (₹{float(amt):,.0f} cash collected today)", route="/cash/closing", kind="action")


def job_scheduled_reports(app):
    with app.app_context(), session_scope() as s:
        from app.models import ReportDefinition, ReportRun
        from app.services.numbering import next_no
        from app.services.reports import run_dataset
        from app.services.notify import queue_email
        now = datetime.now(); today = now.date().isoformat()
        for d in s.query(ReportDefinition).filter(ReportDefinition.schedule != None).all():  # noqa: E711
            sch = d.schedule or {}
            if sch.get("hour") != now.hour or d.last_run_on == today:
                continue
            if sch.get("weekday") and now.weekday() not in sch["weekday"]:
                continue
            rows = run_dataset(s, d.dataset, None, {"where": d.filters or []}, d.columns, d.sort_by, d.sort_desc, d.group_by, d.row_limit)
            run = ReportRun(no=next_no(s, "RPT"), definition_id=d.id, name=d.name, version=d.version, trigger="schedule", rows=len(rows), recipients=sch.get("to"), status="Delivered")
            s.add(run); d.last_run_on = today
            for to in sch.get("to") or []:
                queue_email(s, to, f"Scheduled report: {d.name}", f"{len(rows)} rows. Open the app to download.", trigger="scheduled_report")


def start_scheduler(app):
    sched = BackgroundScheduler(timezone=app.config["TIMEZONE"])
    sched.add_job(job_gap_scan, CronTrigger(hour=app.config["GAP_SCAN_CRON_HOUR"], minute=0), args=[app], id="gap_scan", replace_existing=True)
    sched.add_job(job_daily_brief, CronTrigger(hour=7, minute=0), args=[app], id="daily_brief", replace_existing=True)
    sched.add_job(job_cash_close_reminder, CronTrigger(hour=18, minute=30), args=[app], id="cash_close_reminder", replace_existing=True)
    sched.add_job(job_scheduled_reports, CronTrigger(minute="*/15"), args=[app], id="scheduled_reports", replace_existing=True)
    sched.start()
    app.extensions["scheduler"] = sched
    log.info("scheduler started with %d jobs", len(sched.get_jobs()))
    return sched
