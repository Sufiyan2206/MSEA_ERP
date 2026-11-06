"""Daily executive brief + dashboard KPIs (the old 'daily executive brief' automation)."""
from datetime import date, timedelta

from sqlalchemy import func

from app.models import Branch, CashHandover, CashierClosing, FeeDemand, GapRecord, Lead, Receipt, StaffAttendance, Student, StudentAttendance
from app.services.gap_engine import compliance_score


def kpis(s, bids, today: date | None = None) -> dict:
    today = today or date.today()
    m1 = today.replace(day=1)
    def sc(q, col):
        return q if bids is None else q.filter(col.in_(list(bids)))
    students = sc(s.query(func.count()).select_from(Student).filter(Student.status == "Active"), Student.branch_id).scalar()
    today_coll = sc(s.query(func.coalesce(func.sum(Receipt.total), 0)).filter(Receipt.status == "Paid", Receipt.receipt_date == today), Receipt.branch_id).scalar()
    mtd = sc(s.query(func.coalesce(func.sum(Receipt.total), 0)).filter(Receipt.status == "Paid", Receipt.receipt_date >= m1), Receipt.branch_id).scalar()
    outstanding = sc(s.query(func.coalesce(func.sum(FeeDemand.amount - FeeDemand.concession - FeeDemand.paid), 0)).join(Student, Student.id == FeeDemand.student_id), Student.branch_id).scalar()
    overdue = sc(s.query(func.coalesce(func.sum(FeeDemand.amount - FeeDemand.concession - FeeDemand.paid), 0)).join(Student, Student.id == FeeDemand.student_id).filter(FeeDemand.due_date < today), Student.branch_id).scalar()
    open_gaps = sc(s.query(func.count()).select_from(GapRecord).filter(GapRecord.state.in_(["Open", "Acknowledged", "In progress"])), GapRecord.branch_id).scalar()
    crit = sc(s.query(func.count()).select_from(GapRecord).filter(GapRecord.state.in_(["Open", "Acknowledged", "In progress"]), GapRecord.risk == "Critical"), GapRecord.branch_id).scalar()
    leads = sc(s.query(func.count()).select_from(Lead).filter(Lead.stage.notin_(["Admitted", "Lost"])), Lead.branch_id).scalar()
    admitted_m = sc(s.query(func.count()).select_from(Student).filter(Student.join_date >= m1), Student.branch_id).scalar()
    cash_pending = sc(s.query(func.coalesce(func.sum(CashHandover.amount), 0)).filter(CashHandover.state.in_(["Submitted", "Accepted"])), CashHandover.branch_id).scalar()
    att_marked = sc(s.query(func.count()).select_from(StudentAttendance).filter(StudentAttendance.att_date == today, StudentAttendance.period == 0), StudentAttendance.branch_id).scalar()
    att_present = sc(s.query(func.count()).select_from(StudentAttendance).filter(StudentAttendance.att_date == today, StudentAttendance.period == 0, StudentAttendance.status.in_(["P", "L"])), StudentAttendance.branch_id).scalar()
    staff_marked = sc(s.query(func.count()).select_from(StaffAttendance).filter(StaffAttendance.att_date == today), StaffAttendance.branch_id).scalar()
    staff_present = sc(s.query(func.count()).select_from(StaffAttendance).filter(StaffAttendance.att_date == today, StaffAttendance.status == "P"), StaffAttendance.branch_id).scalar()
    return {"date": today.isoformat(), "students": students, "collection_today": float(today_coll), "collection_mtd": float(mtd), "outstanding": float(outstanding), "overdue": float(overdue),
            "collection_pct": round(float(mtd) * 100 / (float(mtd) + float(outstanding)), 1) if (float(mtd) + float(outstanding)) else 0,
            "open_gaps": open_gaps, "critical_gaps": crit, "open_enquiries": leads, "admissions_mtd": admitted_m, "cash_in_transit": float(cash_pending),
            "student_attendance_pct": round(att_present * 100 / att_marked, 1) if att_marked else None, "staff_attendance_pct": round(staff_present * 100 / staff_marked, 1) if staff_marked else None,
            "compliance": compliance_score(s, None if bids is None or len(bids) != 1 else next(iter(bids)))}


def daily_brief(s, bids, today: date | None = None) -> dict:
    """Plain-language brief for management: top numbers, red flags, top 5 branches by outstanding."""
    today = today or date.today()
    k = kpis(s, bids, today)
    flags = []
    if k["critical_gaps"]:
        flags.append(f"{k['critical_gaps']} critical gap(s) open — see Gap Center.")
    if k["cash_in_transit"] > 0:
        flags.append(f"₹{k['cash_in_transit']:,.0f} cash handed over but not yet deposited.")
    if k["student_attendance_pct"] is not None and k["student_attendance_pct"] < 85:
        flags.append(f"Student attendance today {k['student_attendance_pct']}% (<85%).")
    if k["overdue"] > 0:
        flags.append(f"₹{k['overdue']:,.0f} fees overdue ({k['overdue'] * 100 / max(k['outstanding'], 1):.0f}% of outstanding).")
    per_branch = []
    for b in s.query(Branch).filter_by(active=True).all():
        if bids is not None and b.id not in bids:
            continue
        bk = kpis(s, {b.id}, today)
        per_branch.append({"branch": b.name, "outstanding": bk["outstanding"], "mtd": bk["collection_mtd"], "open_gaps": bk["open_gaps"], "attendance": bk["student_attendance_pct"], "compliance": bk["compliance"]["score"]})
    per_branch.sort(key=lambda r: -r["outstanding"])
    return {"kpis": k, "flags": flags, "branches": per_branch[:10],
            "headline": f"{today:%d %b %Y}: collected ₹{k['collection_today']:,.0f} today, ₹{k['collection_mtd']:,.0f} MTD ({k['collection_pct']}% of demand); {k['open_gaps']} gaps open, compliance {k['compliance']['score']}/100."}
