from datetime import date

from flask import Blueprint, Response, g, request

from app.api._common import db, ok
from app.core.errors import ApiError, Conflict, NotFound, PolicyViolation
from app.core.security import assert_scope, current_user, require, scope_filter
from app.core.validation import as_date, body, need, page_args
from app.models import Employee, LeaveRequest, PayrollRun
from app.services import audit
from app.services import hr as svc

bp = Blueprint("hr", __name__, url_prefix="/hr")

SAFE_EXCL = {"pan", "uan", "esi_no", "bank_account", "extra"}


def _edto(e: Employee, full=False):
    return dict(e.to_dict(exclude=set() if full else SAFE_EXCL), branch=e.branch.name if e.branch else None)


@bp.get("/employees")
@require("hr", "View")
def employees():
    s = db(); limit, offset = page_args(); q = scope_filter(s.query(Employee), Employee.branch_id)
    a = request.args
    if a.get("status"): q = q.filter(Employee.status == a["status"])
    if a.get("branch_id"): q = q.filter(Employee.branch_id == a["branch_id"])
    if a.get("q"):
        like = f"%{a['q']}%"; q = q.filter((Employee.name.ilike(like)) | (Employee.emp_code.ilike(like)))
    total = q.count()
    return ok([_edto(e) for e in q.order_by(Employee.name).offset(offset).limit(limit).all()], total=total)


@bp.post("/employees")
@require("hr", "Add")
def add_employee():
    d = body(); need(d, "emp_code", "name", "doj", "ctc"); s = db()
    if d.get("branch_id"): assert_scope(d["branch_id"])
    if s.query(Employee).filter_by(emp_code=d["emp_code"]).first(): raise Conflict("Employee code exists.")
    e = Employee(emp_code=d["emp_code"], name=d["name"], branch_id=d.get("branch_id"), department=d.get("department"), designation=d.get("designation"), category=d.get("category", "Teaching"), doj=as_date(d["doj"], "doj"), status="Active", ctc=float(d["ctc"]),
                 pan=d.get("pan"), uan=d.get("uan"), esi_no=d.get("esi_no"), bank_account=d.get("bank_account"), bank_ifsc=d.get("bank_ifsc"), mobile=d.get("mobile"), email=d.get("email"), created_by=g.user.id)
    s.add(e); audit.record(s, "hr", "Employee added", entity="employee", entity_id=e.id, branch_id=e.branch_id, new={"emp_code": e.emp_code, "name": e.name}); s.commit()
    return ok(_edto(e, full=True)), 201


@bp.get("/employees/<eid>")
@require("hr", "View")
def get_employee(eid):
    s = db(); e = s.get(Employee, eid)
    if not e: raise NotFound("Employee not found.")
    assert_scope(e.branch_id)
    from app.core.security import can
    return ok(_edto(e, full=can("hr", "Edit")))


@bp.patch("/employees/<eid>")
@require("hr", "Edit")
def edit_employee(eid):
    d = body(); s = db(); e = s.get(Employee, eid)
    if not e: raise NotFound("Employee not found.")
    assert_scope(e.branch_id)
    if len((d.get("reason") or "").strip()) < 5: raise ApiError("Reason (5+ chars) required.")
    old = e.to_dict(exclude={"extra"})
    for k in ("name", "branch_id", "department", "designation", "category", "ctc", "pan", "uan", "esi_no", "bank_account", "bank_ifsc", "mobile", "email", "status"):
        if k in d: setattr(e, k, d[k])
    if "dol" in d: e.dol = as_date(d["dol"], "dol") if d["dol"] else None
    audit.record(s, "hr", "Employee edited", entity="employee", entity_id=eid, branch_id=e.branch_id, old=old, new={k: v for k, v in d.items() if k != "reason"}, reason=d["reason"]); s.commit()
    return ok(_edto(e, full=True))


@bp.get("/leave")
def leave_list():
    u = current_user(); s = db(); q = s.query(LeaveRequest)
    from app.core.security import can
    if can("hr", "Approve") or can("hr", "View"):
        q = q.join(Employee, Employee.id == LeaveRequest.employee_id); q = scope_filter(q, Employee.branch_id)
        if request.args.get("status"): q = q.filter(LeaveRequest.status == request.args["status"])
    else:
        if not u.employee_id: return ok([])
        q = q.filter(LeaveRequest.employee_id == u.employee_id)
    return ok([dict(l.to_dict(), employee=s.get(Employee, l.employee_id).name) for l in q.order_by(LeaveRequest.created_at.desc()).limit(300).all()])


@bp.post("/leave")
def apply_leave():
    u = current_user(); d = body(); need(d, "kind", "from_date", "to_date", "reason"); s = db()
    emp_id = d.get("employee_id") or u.employee_id
    if not emp_id: raise PolicyViolation("No employee linked to your login.")
    if d.get("employee_id") and d["employee_id"] != u.employee_id:
        from app.core.security import can
        if not can("hr", "Add"): raise PolicyViolation("Only HR can apply leave on behalf of others.")
    f, t = as_date(d["from_date"], "from_date"), as_date(d["to_date"], "to_date")
    if t < f: raise PolicyViolation("to_date before from_date.")
    overlap = s.query(LeaveRequest).filter(LeaveRequest.employee_id == emp_id, LeaveRequest.status != "Rejected", LeaveRequest.from_date <= t, LeaveRequest.to_date >= f).first()
    if overlap: raise Conflict("Overlapping leave request exists.")
    l = LeaveRequest(employee_id=emp_id, kind=d["kind"], from_date=f, to_date=t, days=(t - f).days + 1, reason=d["reason"], status="Requested", created_by=u.id)
    s.add(l); audit.record(s, "hr", "Leave applied", entity="leave", entity_id=l.id, new={"from": str(f), "to": str(t), "kind": d["kind"]}); s.commit()
    from app.services import notify
    e = s.get(Employee, emp_id); notify.notify_roles(s, ["Principal", "HR Manager"], f"Leave request from {e.name}: {f}–{t} ({d['kind']})", branch_id=e.branch_id, route="/hr/leave", kind="action"); s.commit()
    return ok(l.to_dict()), 201


@bp.post("/leave/<lid>/decide")
@require("hr", "Approve")
def decide_leave(lid):
    d = body(); s = db(); l = svc.decide_leave(s, lid, bool(d.get("approve")), d.get("note")); s.commit(); return ok(l.to_dict())


@bp.get("/payroll")
@require("payroll", "View")
def payroll_runs():
    s = db(); q = s.query(PayrollRun)
    if g.scope is not None: q = q.filter((PayrollRun.branch_id.in_(list(g.scope))) | (PayrollRun.branch_id == None))  # noqa: E711
    return ok([r.to_dict() for r in q.order_by(PayrollRun.ym.desc()).all()])


@bp.post("/payroll")
@require("payroll", "Add")
def compute():
    d = body(); need(d, "ym"); s = db()
    if d.get("branch_id"): assert_scope(d["branch_id"])
    r = svc.compute_payroll(s, d["ym"], d.get("branch_id")); s.commit(); return ok(r.to_dict()), 201


@bp.get("/payroll/<rid>")
@require("payroll", "View")
def payroll_run(rid):
    s = db(); r = s.get(PayrollRun, rid)
    if not r: raise NotFound("Run not found.")
    return ok(dict(r.to_dict(), lines=[{**{c.name: getattr(l, c.name) for c in l.__table__.columns}, "employee": s.get(Employee, l.employee_id).name, "emp_code": s.get(Employee, l.employee_id).emp_code} for l in r.lines]))


@bp.post("/payroll/<rid>/transition")
def payroll_transition(rid):
    d = body(); need(d, "to")
    from app.core.security import can
    current_user()
    needed = {"Finance verified": "Verify", "CFO approved": "Approve", "Bank file generated": "Approve", "Paid": "Approve", "Rejected": "Reject"}[d["to"]] if d["to"] in ("Finance verified", "CFO approved", "Bank file generated", "Paid", "Rejected") else None
    if not needed or not can("payroll", needed):
        from app.core.errors import Forbidden
        raise Forbidden(f"payroll:{needed or '?'} required.")
    s = db(); r = svc.payroll_transition(s, rid, d["to"], d.get("note")); s.commit(); return ok(r.to_dict())


@bp.post("/payroll/<rid>/lines/<int:lid>/exclude")
@require("payroll", "Verify")
def exclude_line(rid, lid):
    from app.models import PayrollLine
    d = body(); s = db(); l = s.get(PayrollLine, lid)
    if not l or l.run_id != rid: raise NotFound("Line not found.")
    if len((d.get("reason") or "").strip()) < 5: raise PolicyViolation("Reason required.")
    l.excluded = bool(d.get("excluded", True))
    audit.record(s, "hr", "Payroll line excluded" if l.excluded else "Payroll line restored", entity="payroll", entity_id=rid, new={"employee_id": l.employee_id}, reason=d["reason"]); s.commit()
    return ok({"excluded": l.excluded})


@bp.get("/payroll/<rid>/bank-file")
@require("payroll", "Export")
def bank_file(rid):
    s = db(); r = s.get(PayrollRun, rid)
    if not r: raise NotFound("Run not found.")
    csv_text = svc.bank_file(s, r)
    audit.record(s, "hr", "Bank file downloaded", entity="payroll", entity_id=rid); s.commit()
    return Response(csv_text, mimetype="text/csv", headers={"Content-Disposition": f"attachment; filename={r.bank_file_name or 'bank.csv'}"})
