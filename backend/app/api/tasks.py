"""Delegations and daily/monthly checklists (Task centre)."""
from datetime import date, datetime

from flask import Blueprint, g, request

from app.api._common import db, ok
from app.core.errors import NotFound, PolicyViolation
from app.core.security import assert_scope, current_user, require
from app.core.validation import as_date, body, need
from app.models import Checklist, ChecklistItem, Delegation, User
from app.services import audit, notify

bp = Blueprint("tasks", __name__, url_prefix="/tasks")

DAILY = {"Fee Collector": ["Open cash counter and verify opening float", "Collect fees and issue receipts", "Close cash day with denominations", "Hand over cash to accountant"],
         "Branch Accountant": ["Accept cash handovers", "Verify cashier closings", "Bank deposit and record reference", "Review open fee gaps"],
         "Principal": ["Review today's attendance (students & staff)", "Review open gaps assigned to the branch", "Decide pending leave and concession requests", "Check enquiry follow-ups"],
         "Class Teacher": ["Mark attendance before 10:00", "Record late/leave remarks", "Review students below 75%"],
         "Admission Counsellor": ["Call enquiries due today", "Update stages and next follow-up", "Admit SRF-paid leads"]}
MONTHLY = {"Branch Accountant": ["Reconcile collections with bank", "Review outstanding report and send reminders", "Verify refunds paid"],
           "HR Manager": ["Compute payroll", "Verify variance flags", "Generate bank file after CFO approval"],
           "Principal": ["Review branch scorecard", "Sign off compliance score"]}


@bp.get("/checklist")
def checklist():
    """Today's (or this month's) checklist for the user's role & branch — auto-created on first open."""
    u = current_user(); s = db(); kind = request.args.get("kind", "daily"); bid = request.args.get("branch_id") or u.branch_id
    if not bid: return ok(None)
    assert_scope(bid)
    period = date.today().isoformat() if kind == "daily" else date.today().strftime("%Y-%m")
    key_kind = f"{kind}:{u.role.name}"
    cl = s.query(Checklist).filter_by(branch_id=bid, kind=key_kind, period=period).first()
    if not cl:
        template = (DAILY if kind == "daily" else MONTHLY).get(u.role.name)
        if not template: return ok(None)
        cl = Checklist(branch_id=bid, kind=key_kind, period=period, created_by=u.id); s.add(cl); s.flush()
        for i, t in enumerate(template, 1): s.add(ChecklistItem(checklist_id=cl.id, seq=i, text=t))
        s.commit()
    return ok(dict(cl.to_dict(), items=[{"id": i.id, "seq": i.seq, "text": i.text, "done": i.done, "done_by": i.done_by, "done_at": i.done_at.isoformat() if i.done_at else None, "note": i.note, "evidence": i.evidence} for i in cl.items]))


@bp.post("/checklist/items/<int:iid>")
def tick(iid):
    u = current_user(); d = body(); s = db(); it = s.get(ChecklistItem, iid)
    if not it: raise NotFound("Item not found.")
    cl = s.get(Checklist, it.checklist_id); assert_scope(cl.branch_id)
    it.done = bool(d.get("done", True)); it.done_by = u.name if it.done else None; it.done_at = datetime.utcnow() if it.done else None; it.note = d.get("note"); it.evidence = d.get("evidence")
    if all(x.done for x in cl.items): cl.completed_at = datetime.utcnow(); cl.completed_by = u.name
    else: cl.completed_at = None; cl.completed_by = None
    audit.record(s, "tasks", "Checklist item " + ("done" if it.done else "reopened"), entity="checklist", entity_id=cl.id, branch_id=cl.branch_id, new={"item": it.text, "note": it.note}); s.commit()
    return ok({"done": it.done, "completed": cl.completed_at is not None})


@bp.get("/delegations")
def delegations():
    u = current_user(); s = db()
    q = s.query(Delegation).filter((Delegation.from_user_id == u.id) | (Delegation.to_user_id == u.id))
    from app.core.security import can
    if can("admin", "View"): q = s.query(Delegation)
    return ok([dict(x.to_dict(), from_user=s.get(User, x.from_user_id).name, to_user=s.get(User, x.to_user_id).name) for x in q.order_by(Delegation.valid_from.desc()).all()])


@bp.post("/delegations")
def delegate():
    u = current_user(); d = body(); need(d, "to_user_id", "valid_from", "valid_to", "reason"); s = db()
    if d["to_user_id"] == u.id: raise PolicyViolation("Cannot delegate to yourself.")
    to = s.get(User, d["to_user_id"])
    if not to: raise NotFound("User not found.")
    f, t = as_date(d["valid_from"], "valid_from"), as_date(d["valid_to"], "valid_to")
    if t < f or (t - f).days > 45: raise PolicyViolation("Delegation must be 1–45 days.")
    dl = Delegation(from_user_id=u.id, to_user_id=to.id, valid_from=f, valid_to=t, reason=d["reason"], active=True, created_by=u.id)
    s.add(dl); audit.record(s, "tasks", "Delegation created", entity="delegation", entity_id=dl.id, new={"to": to.username, "from_date": str(f), "to_date": str(t)}, reason=d["reason"])
    notify.notify_users(s, [to.id], f"{u.name} delegated approvals to you {f}–{t}: {d['reason']}", route="/tasks", kind="info"); s.commit()
    return ok(dl.to_dict()), 201


@bp.post("/delegations/<did>/revoke")
def revoke(did):
    u = current_user(); s = db(); dl = s.get(Delegation, did)
    if not dl: raise NotFound("Delegation not found.")
    from app.core.security import can
    if dl.from_user_id != u.id and not can("admin", "Edit"): raise PolicyViolation("Only the delegator or admin can revoke.")
    dl.active = False; audit.record(s, "tasks", "Delegation revoked", entity="delegation", entity_id=did); s.commit(); return ok(dl.to_dict())
