from flask import Blueprint, g, request

from app.api._common import db, ok
from app.core.errors import NotFound
from app.core.security import assert_scope, can, require, scope_filter
from app.core.validation import as_date, body, need, page_args
from app.models import LEAD_STAGES, Lead, LeadEvent
from app.services import admissions as svc
from app.services import audit

bp = Blueprint("admissions", __name__, url_prefix="/admissions")


def _dto(l: Lead):
    return dict(l.to_dict(), branch=l.branch.name, counsellor=l.counsellor.name if l.counsellor else None)


@bp.get("/stages")
def stages():
    return ok(LEAD_STAGES)


@bp.get("/leads")
@require("admissions", "View")
def leads():
    s = db(); limit, offset = page_args()
    q = scope_filter(s.query(Lead), Lead.branch_id)
    a = request.args
    if a.get("stage"): q = q.filter(Lead.stage == a["stage"])
    if a.get("branch_id"): q = q.filter(Lead.branch_id == a["branch_id"])
    if a.get("mine") == "1": q = q.filter(Lead.counsellor_id == g.user.id)
    if a.get("q"):
        like = f"%{a['q']}%"; q = q.filter((Lead.name.ilike(like)) | (Lead.mobile.ilike(like)) | (Lead.no.ilike(like)))
    total = q.count()
    return ok([_dto(x) for x in q.order_by(Lead.updated_at.desc()).offset(offset).limit(limit).all()], total=total)


@bp.post("/leads")
@require("admissions", "Add")
def create():
    d = body(); need(d, "branch_id", "name", "class_name", "mobile"); assert_scope(d["branch_id"]); s = db()
    if d.get("next_follow_up"): d["next_follow_up"] = as_date(d["next_follow_up"], "next_follow_up")
    l = svc.create_lead(s, d); s.commit()
    return ok(_dto(l)), 201


@bp.get("/leads/<lid>")
@require("admissions", "View")
def get_lead(lid):
    s = db(); l = s.get(Lead, lid)
    if not l: raise NotFound("Enquiry not found.")
    assert_scope(l.branch_id)
    ev = s.query(LeadEvent).filter_by(lead_id=lid).order_by(LeadEvent.at.desc()).all()
    return ok(dict(_dto(l), events=[{"at": e.at.isoformat(), "kind": e.kind, "text": e.text, "by": e.by_name} for e in ev]))


@bp.post("/leads/<lid>/follow-up")
@require("admissions", "Edit")
def follow_up(lid):
    d = body(); need(d, "note"); s = db(); l = s.get(Lead, lid)
    if not l: raise NotFound("Enquiry not found.")
    assert_scope(l.branch_id)
    if d.get("next_follow_up"): l.next_follow_up = as_date(d["next_follow_up"], "next_follow_up")
    svc.add_event(s, l, "follow-up", d["note"])
    audit.record(s, "admissions", "Follow-up recorded", entity="lead", entity_id=lid, branch_id=l.branch_id, new={"note": d["note"], "next": str(l.next_follow_up)})
    s.commit(); return ok(_dto(l))


@bp.post("/leads/<lid>/stage")
@require("admissions", "Edit")
def stage(lid):
    d = body(); need(d, "to"); s = db(); l = s.get(Lead, lid)
    if not l: raise NotFound("Enquiry not found.")
    assert_scope(l.branch_id)
    if d["to"] == "Admitted" and not (can("students", "Add") or can("admissions", "Approve")):
        from app.core.errors import Forbidden
        raise Forbidden("Admitting needs students:Add or admissions:Approve.")
    l = svc.move_stage(s, lid, d["to"], d.get("note"), srf_amount=d.get("srf_amount"), section=d.get("section")); s.commit()
    return ok(_dto(l))
