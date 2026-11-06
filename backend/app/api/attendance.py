"""Student (daily + period) and staff attendance."""
from datetime import date, datetime, timedelta

from flask import Blueprint, g, request

from app.api._common import db, ok
from app.core.errors import NotFound, PolicyViolation
from app.core.security import assert_scope, require, scope_filter
from app.core.validation import as_date, body, need, one_of
from app.models import STUDENT_STATUS, Employee, StaffAttendance, Student, StudentAttendance
from app.services import audit, notify

bp = Blueprint("attendance", __name__, url_prefix="/attendance")


@bp.get("/statuses")
def statuses():
    return ok(STUDENT_STATUS)


@bp.get("/students")
@require("attendance", "View")
def sheet():
    """Roster + existing marks for branch/class/section/date/period."""
    s = db(); a = request.args
    bid = a.get("branch_id") or g.user.branch_id; cls = a.get("class_name"); sec = a.get("section")
    d = as_date(a.get("date") or str(date.today()), "date"); period = int(a.get("period") or 0)
    if not (bid and cls): raise PolicyViolation("branch_id and class_name are required.")
    assert_scope(bid)
    q = s.query(Student).filter_by(branch_id=bid, class_name=cls, status="Active")
    if sec: q = q.filter(Student.section == sec)
    roster = q.order_by(Student.name).all()
    marks = {m.student_id: m for m in s.query(StudentAttendance).filter(StudentAttendance.branch_id == bid, StudentAttendance.class_name == cls, StudentAttendance.att_date == d, StudentAttendance.period == period).all()}
    return ok({"date": d.isoformat(), "period": period, "locked": d < date.today() - timedelta(days=2),
               "rows": [{"student_id": st.id, "admission_no": st.admission_no, "name": st.name, "section": st.section, "status": marks[st.id].status if st.id in marks else None} for st in roster]})


@bp.post("/students")
@require("attendance", "Add")
def mark():
    """Bulk mark: {branch_id, class_name, section?, date, period, marks:[{student_id,status}], reason?}.
    Dates older than 2 days need attendance:Edit + reason (correction)."""
    d = body(); need(d, "class_name", "marks"); s = db()
    bid = d.get("branch_id") or g.user.branch_id; assert_scope(bid)
    dt = as_date(d.get("date") or str(date.today()), "date"); period = int(d.get("period") or 0)
    if dt > date.today(): raise PolicyViolation("Cannot mark attendance for a future date.")
    correction = dt < date.today() - timedelta(days=2)
    if correction:
        from app.core.security import can
        if not can("attendance", "Edit") or len((d.get("reason") or "").strip()) < 5:
            raise PolicyViolation("Back-dated attendance (>2 days) is a correction: needs Edit permission and a reason.")
    n = 0
    for m in d["marks"]:
        one_of(m["status"], list(STUDENT_STATUS), "status")
        st = s.get(Student, m["student_id"])
        if not st or st.branch_id != bid: raise PolicyViolation("Student not in this branch.")
        row = s.query(StudentAttendance).filter_by(student_id=st.id, att_date=dt, period=period).first()
        if row:
            if row.status != m["status"]:
                audit.record(s, "attendance", "Attendance corrected", entity="student", entity_id=st.id, branch_id=bid, old={"status": row.status}, new={"status": m["status"], "date": str(dt)}, reason=d.get("reason"))
                row.status = m["status"]; row.marked_by = g.user.id; row.corrected_reason = d.get("reason")
        else:
            s.add(StudentAttendance(student_id=st.id, branch_id=bid, class_name=st.class_name, section=st.section, att_date=dt, period=period, status=m["status"], marked_by=g.user.id, corrected_reason=d.get("reason") if correction else None))
        n += 1
        if m["status"] == "A" and period == 0:
            # 3 consecutive daily absences -> notify class teacher/principal
            prev = s.query(StudentAttendance).filter(StudentAttendance.student_id == st.id, StudentAttendance.period == 0, StudentAttendance.att_date.in_([dt - timedelta(days=1), dt - timedelta(days=2)]), StudentAttendance.status == "A").count()
            if prev == 2:
                notify.notify_roles(s, ["Principal"], f"{st.name} ({st.admission_no}) absent 3 consecutive days", branch_id=bid, ref=st.id, route=f"/students/{st.id}", kind="warn")
    audit.record(s, "attendance", "Attendance marked", entity="class", entity_id=f"{bid}:{d['class_name']}", branch_id=bid, new={"date": str(dt), "period": period, "count": n})
    s.commit(); return ok({"marked": n})


@bp.get("/students/<sid>/summary")
@require("attendance", "View")
def summary(sid):
    s = db(); st = s.get(Student, sid)
    if not st: raise NotFound("Student not found.")
    assert_scope(st.branch_id)
    since = date.today() - timedelta(days=int(request.args.get("days") or 90))
    rows = s.query(StudentAttendance).filter(StudentAttendance.student_id == sid, StudentAttendance.period == 0, StudentAttendance.att_date >= since).order_by(StudentAttendance.att_date.desc()).all()
    present = sum(1 for r in rows if r.status in ("P", "L"))
    return ok({"days": len(rows), "present": present, "pct": round(present * 100 / len(rows), 1) if rows else None, "by_status": {k: sum(1 for r in rows if r.status == k) for k in STUDENT_STATUS},
               "exam_eligible": (present * 100 / len(rows) >= 75) if rows else None, "rows": [{"date": r.att_date.isoformat(), "status": r.status} for r in rows[:60]]})


@bp.get("/staff")
@require("hr", "View")
def staff_sheet():
    s = db(); bid = request.args.get("branch_id") or g.user.branch_id; d = as_date(request.args.get("date") or str(date.today()), "date"); assert_scope(bid)
    emps = s.query(Employee).filter_by(branch_id=bid, status="Active").order_by(Employee.name).all()
    marks = {m.employee_id: m for m in s.query(StaffAttendance).filter_by(branch_id=bid, att_date=d).all()}
    return ok({"date": d.isoformat(), "rows": [{"employee_id": e.id, "emp_code": e.emp_code, "name": e.name, "designation": e.designation, "status": marks[e.id].status if e.id in marks else None,
                                                "in_time": marks[e.id].in_time.isoformat() if e.id in marks and marks[e.id].in_time else None} for e in emps]})


@bp.post("/staff")
@require("hr", "Add")
def staff_mark():
    d = body(); need(d, "marks"); s = db(); bid = d.get("branch_id") or g.user.branch_id; assert_scope(bid)
    dt = as_date(d.get("date") or str(date.today()), "date")
    if dt > date.today(): raise PolicyViolation("Future date not allowed.")
    for m in d["marks"]:
        one_of(m["status"], ["P", "A", "H", "L", "W"], "status")  # present, absent, half day, leave, weekly off
        e = s.get(Employee, m["employee_id"])
        if not e or e.branch_id != bid: raise PolicyViolation("Employee not in this branch.")
        row = s.query(StaffAttendance).filter_by(employee_id=e.id, att_date=dt).first()
        if row:
            if row.status != m["status"]:
                if len((d.get("reason") or "").strip()) < 5: raise PolicyViolation("Changing a staff mark needs a reason (regularisation).")
                audit.record(s, "hr", "Staff attendance regularised", entity="employee", entity_id=e.id, branch_id=bid, old={"status": row.status}, new={"status": m["status"], "date": str(dt)}, reason=d["reason"])
                row.status = m["status"]; row.regularised_by = g.user.id; row.reason = d["reason"]
        else:
            s.add(StaffAttendance(employee_id=e.id, branch_id=bid, att_date=dt, status=m["status"], in_time=datetime.fromisoformat(m["in_time"]) if m.get("in_time") else None, source=d.get("source", "manual")))
    audit.record(s, "hr", "Staff attendance marked", entity="branch", entity_id=bid, branch_id=bid, new={"date": str(dt), "count": len(d["marks"])}); s.commit()
    return ok({"marked": len(d["marks"])})


@bp.post("/self-checkin")
def self_checkin():
    """Mobile PWA: a staff user marks own presence (geo/device stamp recorded in audit)."""
    from app.core.security import current_user
    u = current_user(); s = db()
    if not u.employee_id: raise PolicyViolation("Your login is not linked to an employee record.")
    e = s.get(Employee, u.employee_id); today = date.today()
    if s.query(StaffAttendance).filter_by(employee_id=e.id, att_date=today).first(): raise PolicyViolation("Already checked in today.")
    s.add(StaffAttendance(employee_id=e.id, branch_id=e.branch_id, att_date=today, status="P", in_time=datetime.utcnow(), source="self-pwa"))
    audit.record(s, "hr", "Self check-in", entity="employee", entity_id=e.id, branch_id=e.branch_id, new=body()); s.commit()
    return ok({"checked_in": True})
