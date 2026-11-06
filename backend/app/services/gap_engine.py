"""Gap Analysis engine.

A *detector* is a function (session, today, config) -> list[Finding]. Each finding
carries a dedupe_key so re-running the scan updates `last_seen` on the same gap
instead of creating duplicates. After detection the engine applies the escalation
matrix (EscalationLevel rows per category) and sends reminders.

Adding a rule = add a GapRule row (seed or UI) + a detector function registered in
DETECTORS with the same code. See docs/DEVELOPER-GUIDE.md § "Adding a gap rule".
"""
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta

from sqlalchemy import case, func

from app.models import (CashHandover, CashierClosing, Concession, EscalationLevel, FeeDemand, GapHistory, GapRecord, GapRule, Lead,
                        LeaveRequest, Receipt, Refund, StaffAttendance, Student, StudentAttendance, User, Branch, Employee)
from app.services import audit, notify
from app.services.numbering import next_no


@dataclass
class Finding:
    dedupe_key: str
    text: str
    branch_id: str | None = None
    impact: float = 0
    evidence: str | None = None
    extra: dict = field(default_factory=dict)


# ------------------------------------------------------------- detectors ---
def d_fee_overdue(s, today, cfg):
    """Students with overdue fees > 30 days, grouped per branch."""
    rows = (s.query(FeeDemand.student_id, Student.branch_id, func.sum(FeeDemand.amount - FeeDemand.concession - FeeDemand.paid))
            .join(Student, Student.id == FeeDemand.student_id)
            .filter(FeeDemand.due_date < today - timedelta(days=30), Student.status == "Active")
            .group_by(FeeDemand.student_id, Student.branch_id).having(func.sum(FeeDemand.amount - FeeDemand.concession - FeeDemand.paid) > 0).all())
    per = {}
    for sid, bid, bal in rows:
        per.setdefault(bid, [0, 0.0]); per[bid][0] += 1; per[bid][1] += float(bal)
    return [Finding(f"FEE-OD30:{bid}", f"{n} students with fees overdue >30 days, ₹{amt:,.0f} outstanding", bid, amt) for bid, (n, amt) in per.items()]


def d_cash_not_closed(s, today, cfg):
    """Cashiers who collected cash yesterday but did not close the day."""
    y = today - timedelta(days=1)
    rows = (s.query(Receipt.branch_id, Receipt.cashier_id, func.sum(Receipt.total)).filter(Receipt.receipt_date == y, Receipt.mode == "Cash", Receipt.status == "Paid")
            .group_by(Receipt.branch_id, Receipt.cashier_id).all())
    out = []
    for bid, cid, amt in rows:
        if not s.query(CashierClosing).filter_by(branch_id=bid, cashier_id=cid, closing_date=y).first():
            u = s.get(User, cid)
            out.append(Finding(f"CASH-NOCLOSE:{bid}:{cid}:{y}", f"{u.name if u else cid} collected ₹{float(amt):,.0f} cash on {y} but did not close the day", bid, float(amt)))
    return out


def d_cash_difference(s, today, cfg):
    rows = s.query(CashierClosing).filter(CashierClosing.closing_date >= today - timedelta(days=7), func.abs(CashierClosing.difference) > 0.5).all()
    return [Finding(f"CASH-DIFF:{c.id}", f"Cash difference ₹{c.difference:,.0f} on {c.closing_date} ({c.reason or 'no reason'})", c.branch_id, abs(c.difference)) for c in rows]


def d_handover_pending(s, today, cfg):
    rows = s.query(CashHandover).filter(CashHandover.state == "Submitted", CashHandover.handover_date < today - timedelta(days=1)).all()
    return [Finding(f"HO-PEND:{h.id}", f"Handover {h.no} ₹{h.amount:,.0f} not accepted for {(today - h.handover_date).days} days", h.branch_id, h.amount) for h in rows]


def d_cash_undeposited(s, today, cfg):
    rows = s.query(CashHandover).filter(CashHandover.state == "Accepted", CashHandover.handover_date < today - timedelta(days=2)).all()
    return [Finding(f"HO-NODEP:{h.id}", f"Accepted cash ₹{h.amount:,.0f} ({h.no}) not deposited in bank for {(today - h.handover_date).days} days", h.branch_id, h.amount) for h in rows]


def d_refund_pending(s, today, cfg):
    rows = s.query(Refund).filter(Refund.status.in_(["Requested", "Approved"]), Refund.created_at < datetime.combine(today - timedelta(days=7), datetime.min.time())).all()
    out = []
    for r in rows:
        stu = s.get(Student, r.student_id)
        out.append(Finding(f"REF-PEND:{r.id}", f"Refund {r.no} ₹{r.amount:,.0f} stuck in {r.status} for over 7 days", stu.branch_id if stu else None, r.amount))
    return out


def d_concession_pending(s, today, cfg):
    rows = s.query(Concession).filter(Concession.status == "Requested", Concession.created_at < datetime.combine(today - timedelta(days=5), datetime.min.time())).all()
    out = []
    for c in rows:
        stu = s.get(Student, c.student_id)
        out.append(Finding(f"CONC-PEND:{c.id}", f"Concession ₹{c.amount:,.0f} for {stu.name if stu else '?'} awaiting approval >5 days", stu.branch_id if stu else None, c.amount))
    return out


def d_lead_followup_overdue(s, today, cfg):
    rows = (s.query(Lead.branch_id, func.count()).filter(Lead.stage.notin_(["Admitted", "Lost"]), Lead.next_follow_up < today).group_by(Lead.branch_id).all())
    return [Finding(f"LEAD-FU:{bid}", f"{n} enquiries with follow-up date passed", bid, n) for bid, n in rows]


def d_lead_stale(s, today, cfg):
    cutoff = datetime.combine(today - timedelta(days=14), datetime.min.time())
    rows = s.query(Lead.branch_id, func.count()).filter(Lead.stage.in_(["New", "Contacted"]), Lead.updated_at < cutoff).group_by(Lead.branch_id).all()
    return [Finding(f"LEAD-STALE:{bid}", f"{n} enquiries idle for 14+ days in New/Contacted", bid, n) for bid, n in rows]


def d_srf_not_admitted(s, today, cfg):
    cutoff = datetime.combine(today - timedelta(days=10), datetime.min.time())
    rows = s.query(Lead).filter(Lead.stage == "SRF Paid", Lead.updated_at < cutoff).all()
    return [Finding(f"SRF-NOADM:{l.id}", f"{l.name} paid SRF ₹{l.srf_amount:,.0f} but not admitted for 10+ days", l.branch_id, l.srf_amount) for l in rows]


def d_student_attendance_low(s, today, cfg):
    since = today - timedelta(days=30)
    present = func.sum(case((StudentAttendance.status.in_(["P", "L"]), 1), else_=0))
    rows = (s.query(StudentAttendance.student_id, StudentAttendance.branch_id, func.count(), present)
            .filter(StudentAttendance.att_date >= since, StudentAttendance.period == 0).group_by(StudentAttendance.student_id, StudentAttendance.branch_id).all())
    per = {}
    for sid, bid, n, p in rows:
        if n >= 10 and (p or 0) * 100.0 / n < cfg["ATTENDANCE_MIN_PCT"]:
            per[bid] = per.get(bid, 0) + 1
    return [Finding(f"STU-ATT:{bid}", f"{n} students below {cfg['ATTENDANCE_MIN_PCT']:.0f}% attendance (30 days)", bid, n) for bid, n in per.items()]


def d_attendance_not_marked(s, today, cfg):
    y = today - timedelta(days=1)
    if y.weekday() == 6:
        return []
    out = []
    for b in s.query(Branch).filter_by(active=True).all():
        active = s.query(Student).filter_by(branch_id=b.id, status="Active").count()
        if not active:
            continue
        marked = s.query(StudentAttendance).filter_by(branch_id=b.id, att_date=y, period=0).count()
        if marked * 100.0 / active < 50:
            out.append(Finding(f"ATT-NOTMARKED:{b.id}:{y}", f"Student attendance for {y} marked for only {marked}/{active} students", b.id, active - marked))
    return out


def d_staff_absent_unapproved(s, today, cfg):
    y = today - timedelta(days=1)
    rows = s.query(StaffAttendance).filter_by(att_date=y, status="A").all()
    out = {}
    for r in rows:
        leave = s.query(LeaveRequest).filter(LeaveRequest.employee_id == r.employee_id, LeaveRequest.status == "Approved", LeaveRequest.from_date <= y, LeaveRequest.to_date >= y).first()
        if not leave:
            out[r.branch_id] = out.get(r.branch_id, 0) + 1
    return [Finding(f"STAFF-ABS:{bid}:{y}", f"{n} staff absent on {y} without approved leave", bid, n) for bid, n in out.items()]


def d_leave_pending(s, today, cfg):
    cutoff = datetime.combine(today - timedelta(days=3), datetime.min.time())
    rows = s.query(LeaveRequest).filter(LeaveRequest.status == "Requested", LeaveRequest.created_at < cutoff).all()
    out = {}
    for l in rows:
        e = s.get(Employee, l.employee_id); out[e.branch_id if e else None] = out.get(e.branch_id if e else None, 0) + 1
    return [Finding(f"LEAVE-PEND:{bid}", f"{n} leave requests waiting >3 days", bid, n) for bid, n in out.items()]


def d_section_over_capacity(s, today, cfg):
    from app.models import Section
    out = []
    for sec in s.query(Section).all():
        n = s.query(Student).filter_by(branch_id=sec.branch_id, class_name=sec.class_name, section=sec.name, status="Active").count()
        if n > sec.capacity:
            out.append(Finding(f"SEC-CAP:{sec.id}", f"{sec.class_name}-{sec.name} has {n} students against capacity {sec.capacity}", sec.branch_id, n - sec.capacity))
    return out


def d_user_inactive(s, today, cfg):
    cutoff = datetime.combine(today - timedelta(days=45), datetime.min.time())
    rows = s.query(User).filter(User.status == "Active", (User.last_login_at == None) | (User.last_login_at < cutoff), User.created_at < cutoff).all()  # noqa: E711
    return [Finding("USER-DORMANT", f"{len(rows)} active user accounts have not signed in for 45+ days", None, len(rows), evidence=", ".join(u.username for u in rows[:10]))] if rows else []


def d_unverified_closings(s, today, cfg):
    rows = s.query(CashierClosing).filter(CashierClosing.status == "Submitted", CashierClosing.closing_date < today - timedelta(days=2)).all()
    return [Finding(f"CLOSE-UNVER:{c.id}", f"Cashier closing {c.closing_date} (₹{c.counted:,.0f}) not verified by accountant", c.branch_id, c.counted) for c in rows]


DETECTORS = {
    "FEE-OD30": d_fee_overdue, "CASH-NOCLOSE": d_cash_not_closed, "CASH-DIFF": d_cash_difference, "HO-PEND": d_handover_pending,
    "HO-NODEP": d_cash_undeposited, "REF-PEND": d_refund_pending, "CONC-PEND": d_concession_pending, "LEAD-FU": d_lead_followup_overdue,
    "LEAD-STALE": d_lead_stale, "SRF-NOADM": d_srf_not_admitted, "STU-ATT": d_student_attendance_low, "ATT-NOTMARKED": d_attendance_not_marked,
    "STAFF-ABS": d_staff_absent_unapproved, "LEAVE-PEND": d_leave_pending, "SEC-CAP": d_section_over_capacity, "USER-DORMANT": d_user_inactive,
    "CLOSE-UNVER": d_unverified_closings,
}

# Seed definitions (code, category, title, owner_role, reviewer_role, risk, due_days, action)
RULES = [
    ("FEE-OD30", "Fees & cash", "Fees overdue over 30 days", "Fee Collector", "Branch Accountant", "High", 7, "Call parents, issue reminder letters, record promise-to-pay"),
    ("CASH-NOCLOSE", "Fees & cash", "Cash day not closed", "Fee Collector", "Branch Accountant", "Critical", 1, "Close the cash day with denominations today"),
    ("CASH-DIFF", "Fees & cash", "Cash difference at closing", "Branch Accountant", "Principal", "High", 2, "Investigate difference, attach explanation, recover or write off with approval"),
    ("HO-PEND", "Fees & cash", "Handover not accepted", "Branch Accountant", "Principal", "High", 1, "Count and accept the handover"),
    ("HO-NODEP", "Fees & cash", "Cash not deposited in bank", "Branch Accountant", "Finance Manager", "Critical", 1, "Deposit cash and record bank reference"),
    ("CLOSE-UNVER", "Fees & cash", "Closing not verified", "Branch Accountant", "Finance Manager", "Medium", 2, "Verify cashier closing against receipts"),
    ("REF-PEND", "Finance", "Refund pending", "Finance Manager", "CFO", "Medium", 3, "Approve/reject refund; pay approved refunds"),
    ("CONC-PEND", "Finance", "Concession awaiting approval", "Principal", "Finance Manager", "Medium", 3, "Decide the concession request"),
    ("LEAD-FU", "Admissions", "Enquiry follow-up overdue", "Admission Counsellor", "Principal", "Medium", 2, "Call the parent and set the next follow-up date"),
    ("LEAD-STALE", "Admissions", "Stale enquiries", "Admission Counsellor", "Principal", "Low", 5, "Re-contact or mark lost with reason"),
    ("SRF-NOADM", "Admissions", "SRF paid but not admitted", "Admission Counsellor", "Principal", "High", 2, "Complete documents and admit the student"),
    ("STU-ATT", "Academics", "Students below minimum attendance", "Class Teacher", "Principal", "Medium", 7, "Counsel parents; record remarks"),
    ("ATT-NOTMARKED", "Academics", "Attendance not marked", "Class Teacher", "Principal", "High", 1, "Mark attendance for the day"),
    ("SEC-CAP", "Academics", "Section over capacity", "Principal", "Regional Head", "Medium", 10, "Open a new section or redistribute students"),
    ("STAFF-ABS", "HR & payroll", "Staff absent without leave", "HR Manager", "Principal", "Medium", 2, "Regularise attendance or mark LOP"),
    ("LEAVE-PEND", "HR & payroll", "Leave requests pending", "Principal", "HR Manager", "Low", 2, "Decide pending leave requests"),
    ("USER-DORMANT", "Compliance & audit", "Dormant user accounts", "System Admin", "Internal Auditor", "Medium", 7, "Deactivate or confirm accounts"),
]

DEFAULT_MATRIX = [  # (level, offset_days from due date, label, roles)
    (1, 0, "Owner reminder", ["owner"]), (2, 2, "Reviewer", ["reviewer"]), (3, 5, "Branch head", ["Principal"]),
    (4, 10, "Regional / Finance", ["Regional Head", "Finance Manager"]), (5, 15, "Management", ["CFO", "CEO"]),
]


def seed_rules(s):
    for code, cat, title, owner, reviewer, risk, due, action in RULES:
        if not s.query(GapRule).filter_by(code=code).first():
            s.add(GapRule(code=code, category=cat, title=title, owner_role=owner, reviewer_role=reviewer, risk=risk, due_days=due, action=action, active=True))
    from app.models import GAP_CATEGORIES
    for cat in GAP_CATEGORIES:
        if not s.query(EscalationLevel).filter_by(category=cat).first():
            for lvl, off, label, roles in DEFAULT_MATRIX:
                s.add(EscalationLevel(category=cat, level=lvl, offset_days=off, label=label, roles=roles))
    s.flush()


def _pick_user(s, role_name: str, branch_id: str | None):
    from app.models import Role
    q = s.query(User).join(Role).filter(Role.name == role_name, User.status == "Active")
    if branch_id:
        u = q.filter(User.branch_id == branch_id).first()
        if u:
            return u.id
    u = q.filter(User.branch_id == None).first() or q.first()  # noqa: E711
    return u.id if u else None


def scan(s, cfg: dict, today: date | None = None, by: str = "scheduler") -> dict:
    """Run every active rule; upsert GapRecords; auto-resolve gaps no longer detected."""
    today = today or date.today()
    seen_keys, created, updated, resolved = set(), 0, 0, 0
    for rule in s.query(GapRule).filter_by(active=True).all():
        det = DETECTORS.get(rule.code)
        if not det:
            continue
        for f in det(s, today, cfg):
            seen_keys.add(f.dedupe_key)
            g_ = s.query(GapRecord).filter_by(dedupe_key=f.dedupe_key).filter(GapRecord.state.notin_(["Resolved", "Rejected"])).first()
            if g_:
                g_.last_seen = today; g_.text = f.text; g_.impact = f.impact; updated += 1
                continue
            g_ = GapRecord(no=next_no(s, "GAP", None, today), rule_code=rule.code, dedupe_key=f.dedupe_key, category=rule.category, title=rule.title, text=f.text, branch_id=f.branch_id,
                           impact=f.impact, risk=rule.risk, action=rule.action, owner_id=_pick_user(s, rule.owner_role, f.branch_id), reviewer_id=_pick_user(s, rule.reviewer_role, f.branch_id),
                           first_seen=today, last_seen=today, due_date=today + timedelta(days=rule.due_days), state="Open", escalation_level=0, evidence=f.evidence, created_by=by)
            s.add(g_); s.flush()
            s.add(GapHistory(gap_id=g_.id, at=datetime.utcnow(), by_name=by, to_state="Open", note=f.text))
            if g_.owner_id:
                notify.notify_users(s, [g_.owner_id], f"New gap {g_.no}: {rule.title} — {f.text}", ref=g_.id, route=f"/gaps/{g_.id}", kind="action")
            created += 1
    # auto-resolve open detector gaps that no longer fire
    for g_ in s.query(GapRecord).filter(GapRecord.state.in_(["Open", "Acknowledged", "In progress"]), GapRecord.rule_code.in_(list(DETECTORS))).all():
        if g_.dedupe_key not in seen_keys:
            g_.state = "Resolved"; g_.resolution = "Auto-resolved: condition no longer detected"; g_.closed_at = datetime.utcnow(); g_.closed_by = by
            s.add(GapHistory(gap_id=g_.id, at=datetime.utcnow(), by_name=by, to_state="Resolved", note=g_.resolution)); resolved += 1
    esc = escalate(s, today, by)
    audit.record(s, "gaps", "Gap scan", new={"created": created, "updated": updated, "resolved": resolved, "escalated": esc})
    return {"created": created, "updated": updated, "resolved": resolved, "escalated": esc, "date": today.isoformat()}


def escalate(s, today: date, by: str = "scheduler") -> int:
    """Raise escalation_level per the matrix when due_date + offset has passed; notify the roles of that level."""
    n = 0
    for g_ in s.query(GapRecord).filter(GapRecord.state.in_(["Open", "Acknowledged", "In progress"])).all():
        levels = s.query(EscalationLevel).filter_by(category=g_.category).order_by(EscalationLevel.level).all()
        for lvl in levels:
            if lvl.level <= g_.escalation_level:
                continue
            if today >= g_.due_date + timedelta(days=lvl.offset_days):
                g_.escalation_level = lvl.level; n += 1
                ids = []
                for r in lvl.roles:
                    if r == "owner" and g_.owner_id: ids.append(g_.owner_id)
                    elif r == "reviewer" and g_.reviewer_id: ids.append(g_.reviewer_id)
                    elif r not in ("owner", "reviewer"):
                        uid = _pick_user(s, r, g_.branch_id)
                        if uid: ids.append(uid)
                notify.notify_users(s, ids, f"Escalation L{lvl.level} ({lvl.label}): {g_.no} {g_.title} — {g_.text}", ref=g_.id, route=f"/gaps/{g_.id}", kind="escalation")
                s.add(GapHistory(gap_id=g_.id, at=datetime.utcnow(), by_name=by, to_state=g_.state, note=f"Escalated to level {lvl.level} ({lvl.label})"))
        if g_.state != "Resolved" and g_.reminded_on != today and g_.due_date <= today and g_.owner_id:
            g_.reminded_on = today
            notify.notify_users(s, [g_.owner_id], f"Reminder: {g_.no} {g_.title} is due ({g_.due_date})", ref=g_.id, route=f"/gaps/{g_.id}")
    return n


def transition(s, gap_id: str, to: str, note: str | None, file: str | None, user) -> GapRecord:
    from app.core.errors import Conflict, NotFound, PolicyViolation
    g_ = s.get(GapRecord, gap_id)
    if not g_:
        raise NotFound("Gap not found.")
    flow = {"Open": {"Acknowledged", "Rejected"}, "Acknowledged": {"In progress", "Rejected"}, "In progress": {"Resolved"}, "Resolved": set(), "Rejected": {"Open"}}
    if to not in flow[g_.state]:
        raise Conflict(f"Cannot move gap from {g_.state} to {to}.")
    if to in ("Resolved", "Rejected") and len((note or "").strip()) < 10:
        raise PolicyViolation("Resolution / rejection note must be at least 10 characters.")
    if to == "Resolved" and not file and g_.risk in ("High", "Critical"):
        raise PolicyViolation("High/Critical gaps need evidence (file reference) to resolve.")
    old = g_.state; g_.state = to
    if to in ("Resolved", "Rejected"):
        g_.resolution = note; g_.closed_at = datetime.utcnow(); g_.closed_by = user.id
    s.add(GapHistory(gap_id=g_.id, at=datetime.utcnow(), by_name=user.name, to_state=to, note=note, file=file))
    audit.record(s, "gaps", f"Gap {to}", entity="gap", entity_id=g_.id, branch_id=g_.branch_id, old={"state": old}, new={"state": to}, reason=note, evidence=file)
    if g_.reviewer_id and to == "Resolved":
        notify.notify_users(s, [g_.reviewer_id], f"{g_.no} resolved by {user.name}: {note}", ref=g_.id, route=f"/gaps/{g_.id}")
    return g_


def compliance_score(s, branch_id: str | None = None) -> dict:
    q = s.query(GapRecord).filter(GapRecord.state.in_(["Open", "Acknowledged", "In progress"]))
    if branch_id:
        q = q.filter(GapRecord.branch_id == branch_id)
    weights = {"Low": 1, "Medium": 3, "High": 6, "Critical": 10}
    pen = sum(weights[g_.risk] + 2 * g_.escalation_level for g_ in q.all())
    return {"score": max(0, 100 - pen), "open": q.count()}
