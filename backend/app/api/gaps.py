"""Gap Analysis Center API."""
from datetime import date

from flask import Blueprint, current_app, g, request

from app.api._common import db, ok
from app.core.errors import NotFound
from app.core.security import assert_scope, current_user, require, scope_filter
from app.core.validation import body, need, page_args
from app.models import GAP_CATEGORIES, GAP_RISKS, GAP_STATES, EscalationLevel, GapRecord, GapRule
from app.services import audit
from app.services import gap_engine as eng

bp = Blueprint("gaps", __name__, url_prefix="/gaps")


def _dto(x: GapRecord, with_history=False):
    d = dict(x.to_dict(), owner=x.owner.name if x.owner else None, reviewer=x.reviewer.name if x.reviewer else None, overdue=(x.due_date < date.today() and x.state not in ("Resolved", "Rejected")))
    if with_history:
        d["history"] = [{"at": h.at.isoformat(), "by": h.by_name, "to_state": h.to_state, "note": h.note, "file": h.file} for h in x.history]
    return d


@bp.get("/meta")
def meta():
    current_user()
    return ok({"categories": GAP_CATEGORIES, "risks": GAP_RISKS, "states": GAP_STATES})


@bp.get("")
@require("gaps", "View")
def list_gaps():
    s = db(); limit, offset = page_args(100); a = request.args
    q = s.query(GapRecord)
    if g.scope is not None: q = q.filter((GapRecord.branch_id.in_(list(g.scope))) | (GapRecord.branch_id == None))  # noqa: E711
    if a.get("state"): q = q.filter(GapRecord.state == a["state"])
    elif a.get("open", "1") == "1": q = q.filter(GapRecord.state.in_(["Open", "Acknowledged", "In progress"]))
    for k in ("category", "risk", "branch_id", "rule_code"):
        if a.get(k): q = q.filter(getattr(GapRecord, k) == a[k])
    if a.get("mine") == "1": q = q.filter((GapRecord.owner_id == g.user.id) | (GapRecord.reviewer_id == g.user.id))
    total = q.count()
    order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
    items = sorted(q.offset(offset).limit(limit).all(), key=lambda x: (order[x.risk], x.due_date))
    return ok([_dto(x) for x in items], total=total)


@bp.get("/summary")
@require("gaps", "View")
def summary():
    s = db(); q = s.query(GapRecord).filter(GapRecord.state.in_(["Open", "Acknowledged", "In progress"]))
    if g.scope is not None: q = q.filter((GapRecord.branch_id.in_(list(g.scope))) | (GapRecord.branch_id == None))  # noqa: E711
    items = q.all(); today = date.today()
    by = lambda key: {k: sum(1 for x in items if getattr(x, key) == k) for k in sorted({getattr(x, key) for x in items}, key=str)}  # noqa: E731
    return ok({"open": len(items), "overdue": sum(1 for x in items if x.due_date < today), "escalated": sum(1 for x in items if x.escalation_level >= 3), "impact": round(sum(x.impact for x in items), 2),
               "by_category": by("category"), "by_risk": by("risk"), "by_state": by("state"), "compliance": eng.compliance_score(s, None if g.scope is None or len(g.scope) != 1 else next(iter(g.scope)))})


@bp.get("/<gid>")
@require("gaps", "View")
def get_gap(gid):
    s = db(); x = s.get(GapRecord, gid)
    if not x: raise NotFound("Gap not found.")
    assert_scope(x.branch_id); return ok(_dto(x, True))


@bp.post("/<gid>/transition")
@require("gaps", "Edit")
def transition(gid):
    d = body(); need(d, "to"); s = db(); x = s.get(GapRecord, gid)
    if not x: raise NotFound("Gap not found.")
    assert_scope(x.branch_id)
    x = eng.transition(s, gid, d["to"], d.get("note"), d.get("file"), g.user); s.commit(); return ok(_dto(x, True))


@bp.post("/<gid>/reassign")
@require("gaps", "Approve")
def reassign(gid):
    d = body(); need(d, "owner_id", "reason"); s = db(); x = s.get(GapRecord, gid)
    if not x: raise NotFound("Gap not found.")
    old = x.owner_id; x.owner_id = d["owner_id"]
    from app.models import GapHistory
    from datetime import datetime
    s.add(GapHistory(gap_id=x.id, at=datetime.utcnow(), by_name=g.user.name, to_state=x.state, note=f"Reassigned: {d['reason']}"))
    audit.record(s, "gaps", "Gap reassigned", entity="gap", entity_id=gid, branch_id=x.branch_id, old={"owner_id": old}, new={"owner_id": x.owner_id}, reason=d["reason"])
    from app.services import notify
    notify.notify_users(s, [x.owner_id], f"Gap {x.no} assigned to you: {x.title}", ref=x.id, route=f"/gaps/{x.id}", kind="action"); s.commit()
    return ok(_dto(x))


@bp.post("/scan")
@require("gaps", "Approve")
def scan_now():
    s = db(); cfg = {"ATTENDANCE_MIN_PCT": current_app.config["ATTENDANCE_MIN_PCT"], "DAILY_TARGET_PCT": current_app.config["DAILY_TARGET_PCT"]}
    res = eng.scan(s, cfg, by=g.user.name); s.commit(); return ok(res)


@bp.get("/rules")
@require("gaps", "View")
def rules():
    s = db(); return ok([dict(r.to_dict(), has_detector=r.code in eng.DETECTORS) for r in s.query(GapRule).order_by(GapRule.category, GapRule.code).all()])


@bp.patch("/rules/<rid>")
@require("gaps", "Configure Settings")
def edit_rule(rid):
    d = body(); s = db(); r = s.get(GapRule, rid)
    if not r: raise NotFound("Rule not found.")
    old = r.to_dict()
    for k in ("title", "owner_role", "reviewer_role", "risk", "due_days", "action", "thresholds", "active"):
        if k in d: setattr(r, k, d[k])
    audit.record(s, "gaps", "Gap rule edited", entity="gap_rule", entity_id=rid, old=old, new=d, reason=d.get("reason")); s.commit(); return ok(r.to_dict())


@bp.get("/matrix")
@require("gaps", "View")
def matrix():
    s = db(); out = {}
    for lvl in s.query(EscalationLevel).order_by(EscalationLevel.category, EscalationLevel.level).all():
        out.setdefault(lvl.category, []).append(lvl.to_dict())
    return ok(out)


@bp.put("/matrix/<category>")
@require("gaps", "Configure Settings")
def set_matrix(category):
    d = body(); need(d, "levels", "reason"); s = db()
    s.query(EscalationLevel).filter_by(category=category).delete()
    for lv in d["levels"]:
        s.add(EscalationLevel(category=category, level=int(lv["level"]), offset_days=int(lv["offset_days"]), label=lv["label"], roles=lv["roles"]))
    audit.record(s, "gaps", "Escalation matrix changed", entity="matrix", entity_id=category, new=d["levels"], reason=d["reason"]); s.commit(); return ok({"saved": True})
