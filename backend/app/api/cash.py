"""Cashier closing and cash handover chain."""
from datetime import date

from flask import Blueprint, g, request

from app.api._common import db, ok
from app.core.errors import NotFound, PolicyViolation
from app.core.security import assert_scope, require, scope_filter
from app.core.validation import as_date, body, need
from app.models import CashHandover, CashierClosing, User
from app.services import audit
from app.services import fees as svc

bp = Blueprint("cash", __name__, url_prefix="/cash")

DENOMS = [500, 200, 100, 50, 20, 10, 5, 2, 1]


def _uname(s, uid):
    u = s.get(User, uid) if uid else None
    return u.name if u else None


@bp.get("/expected")
@require("cash", "View")
def expected():
    s = db(); bid = request.args.get("branch_id") or g.user.branch_id; d = as_date(request.args.get("date") or str(date.today()), "date")
    assert_scope(bid)
    return ok({"branch_id": bid, "date": d.isoformat(), "expected": svc.expected_cash(s, bid, g.user.id, d), "denominations": DENOMS,
               "closed": bool(s.query(CashierClosing).filter_by(branch_id=bid, cashier_id=g.user.id, closing_date=d).first())})


@bp.get("/closings")
@require("cash", "View")
def closings():
    s = db(); q = scope_filter(s.query(CashierClosing), CashierClosing.branch_id)
    if request.args.get("status"): q = q.filter(CashierClosing.status == request.args["status"])
    return ok([dict(c.to_dict(), cashier=_uname(s, c.cashier_id), verified_by_name=_uname(s, c.verified_by)) for c in q.order_by(CashierClosing.closing_date.desc()).limit(300).all()])


@bp.post("/closings")
@require("cash", "Add")
def close():
    d = body(); need(d, "denominations"); s = db(); bid = d.get("branch_id") or g.user.branch_id
    if not bid: raise PolicyViolation("Branch is required.")
    assert_scope(bid)
    c, ho = svc.close_day(s, branch_id=bid, closing_date=as_date(d.get("closing_date") or str(date.today()), "closing_date"), denominations=d["denominations"], reason=d.get("reason"))
    s.commit(); return ok({"closing": c.to_dict(), "handover": ho.to_dict() if ho else None}), 201


@bp.post("/closings/<cid>/verify")
@require("cash", "Verify")
def verify(cid):
    s = db(); c = s.get(CashierClosing, cid)
    if not c: raise NotFound("Closing not found.")
    assert_scope(c.branch_id)
    if c.cashier_id == g.user.id: raise PolicyViolation("Cashier cannot verify own closing.")
    if c.status != "Submitted": raise PolicyViolation(f"Closing is {c.status}.")
    c.status = "Verified"; c.verified_by = g.user.id
    audit.record(s, "cash", "Closing verified", entity="closing", entity_id=cid, branch_id=c.branch_id, new={"difference": c.difference}); s.commit()
    return ok(c.to_dict())


@bp.get("/handovers")
@require("cash", "View")
def handovers():
    s = db(); q = scope_filter(s.query(CashHandover), CashHandover.branch_id)
    if request.args.get("state"): q = q.filter(CashHandover.state == request.args["state"])
    return ok([dict(h.to_dict(), from_user=_uname(s, h.from_user_id), accepted_by_name=_uname(s, h.accepted_by)) for h in q.order_by(CashHandover.handover_date.desc()).limit(300).all()])


@bp.post("/handovers")
@require("cash", "Add")
def add_handover():
    d = body(); need(d, "amount"); s = db(); bid = d.get("branch_id") or g.user.branch_id; assert_scope(bid)
    from app.models import Branch
    from app.services.numbering import next_no
    hd = as_date(d.get("handover_date") or str(date.today()), "handover_date")
    h = CashHandover(no=next_no(s, "HO", s.get(Branch, bid).code, hd), branch_id=bid, handover_date=hd, from_user_id=g.user.id, amount=float(d["amount"]), denominations=d.get("denominations"), state="Submitted", note=d.get("note"), auto=False, created_by=g.user.id)
    s.add(h); audit.record(s, "cash", "Handover submitted", entity="handover", entity_id=h.id, branch_id=bid, new={"amount": h.amount}); s.commit(); return ok(h.to_dict()), 201


@bp.post("/handovers/<hid>/transition")
@require("cash", "Verify")
def ho_transition(hid):
    d = body(); need(d, "to"); s = db(); h = s.get(CashHandover, hid)
    if not h: raise NotFound("Handover not found.")
    assert_scope(h.branch_id)
    h = svc.handover_transition(s, hid, d["to"], accepted_amount=d.get("accepted_amount"), deposit_ref=d.get("deposit_ref"), note=d.get("note")); s.commit()
    return ok(h.to_dict())
