"""Role dashboards, executive brief, global search."""
from flask import Blueprint, g, request

from app.api._common import db, ok
from app.core.security import current_user, scope_filter
from app.models import Employee, GapRecord, Lead, Receipt, Student
from app.services.brief import daily_brief, kpis

bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")


@bp.get("/kpis")
def get_kpis():
    current_user(); s = db(); bid = request.args.get("branch_id")
    bids = {bid} if bid else g.scope
    if bid and g.scope is not None and bid not in g.scope:
        from app.core.errors import Forbidden
        raise Forbidden("Branch outside scope.")
    return ok(kpis(s, bids))


@bp.get("/brief")
def brief():
    u = current_user(); s = db()
    from app.core.security import can
    if not can("dashboard", "View"):
        from app.core.errors import Forbidden
        raise Forbidden("dashboard:View required.")
    return ok(daily_brief(s, g.scope))


@bp.get("/search")
def search():
    current_user(); s = db(); q = (request.args.get("q") or "").strip()
    if len(q) < 2: return ok([])
    like = f"%{q}%"; out = []
    from app.core.security import can
    if can("students", "View"):
        for st in scope_filter(s.query(Student), Student.branch_id).filter((Student.name.ilike(like)) | (Student.admission_no.ilike(like)) | (Student.mobile.ilike(like))).limit(8).all():
            out.append({"type": "Student", "id": st.id, "title": f"{st.name} ({st.admission_no})", "sub": f"{st.class_name}-{st.section or ''} · {st.branch.name}", "route": f"/students/{st.id}"})
    if can("fees", "View"):
        for r in scope_filter(s.query(Receipt), Receipt.branch_id).filter(Receipt.no.ilike(like)).limit(5).all():
            out.append({"type": "Receipt", "id": r.id, "title": r.no, "sub": f"₹{r.total:,.0f} · {r.student.name}", "route": f"/fees/receipts/{r.id}"})
    if can("admissions", "View"):
        for l in scope_filter(s.query(Lead), Lead.branch_id).filter((Lead.name.ilike(like)) | (Lead.mobile.ilike(like)) | (Lead.no.ilike(like))).limit(5).all():
            out.append({"type": "Enquiry", "id": l.id, "title": f"{l.name} ({l.no})", "sub": l.stage, "route": f"/admissions/{l.id}"})
    if can("hr", "View"):
        for e in scope_filter(s.query(Employee), Employee.branch_id).filter((Employee.name.ilike(like)) | (Employee.emp_code.ilike(like))).limit(5).all():
            out.append({"type": "Employee", "id": e.id, "title": f"{e.name} ({e.emp_code})", "sub": e.designation or "", "route": f"/hr/employees/{e.id}"})
    if can("gaps", "View"):
        for g_ in s.query(GapRecord).filter((GapRecord.no.ilike(like)) | (GapRecord.title.ilike(like))).limit(5).all():
            out.append({"type": "Gap", "id": g_.id, "title": f"{g_.no} {g_.title}", "sub": g_.state, "route": f"/gaps/{g_.id}"})
    return ok(out)
