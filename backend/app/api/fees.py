"""Fee structures, demands, receipts, concessions, refunds."""
from flask import Blueprint, g, request

from app.api._common import db, ok, rows
from app.core.errors import ApiError, Conflict, NotFound, PolicyViolation
from app.core.security import assert_scope, require, scope_filter
from app.core.validation import as_date, as_money, body, need, one_of, page_args
from app.models import PAYMENT_MODES, Concession, FeeHead, FeeStructure, Receipt, Refund, Student
from app.services import audit
from app.services import fees as svc
from app.services.numbering import next_no

bp = Blueprint("fees", __name__, url_prefix="/fees")


@bp.get("/heads")
@require("fees", "View")
def heads():
    return rows(db().query(FeeHead).order_by(FeeHead.name).all())


@bp.post("/heads")
@require("fees", "Configure Settings")
def add_head():
    d = body(); need(d, "code", "name"); s = db()
    if s.query(FeeHead).filter_by(code=d["code"]).first(): raise Conflict("Head code exists.")
    h = FeeHead(code=d["code"], name=d["name"], gl_code=d.get("gl_code"), refundable=bool(d.get("refundable", False)), created_by=g.user.id)
    s.add(h); audit.record(s, "fees", "Fee head added", entity="fee_head", entity_id=h.id, new=d); s.commit(); return ok(h.to_dict()), 201


@bp.get("/structures")
@require("fees", "View")
def structures():
    s = db(); q = scope_filter(s.query(FeeStructure), FeeStructure.branch_id)
    for k in ("branch_id", "academic_year", "class_name", "status"):
        if request.args.get(k): q = q.filter(getattr(FeeStructure, k) == request.args[k])
    return ok([dict(x.to_dict(), head=x.head.name) for x in q.order_by(FeeStructure.class_name).all()])


@bp.post("/structures")
@require("fees", "Configure Settings")
def add_structure():
    d = body(); need(d, "branch_id", "academic_year", "class_name", "head_id", "amount"); assert_scope(d["branch_id"]); s = db()
    prev = s.query(FeeStructure).filter_by(branch_id=d["branch_id"], academic_year=d["academic_year"], class_name=d["class_name"], head_id=d["head_id"]).order_by(FeeStructure.version.desc()).first()
    st = FeeStructure(branch_id=d["branch_id"], academic_year=d["academic_year"], class_name=d["class_name"], head_id=d["head_id"], amount=float(as_money(d["amount"], "amount")), instalments=int(d.get("instalments") or 1), version=(prev.version + 1) if prev else 1, status="Draft", created_by=g.user.id)
    s.add(st); audit.record(s, "fees", "Fee structure drafted", entity="fee_structure", entity_id=st.id, branch_id=st.branch_id, new=d); s.commit()
    return ok(dict(st.to_dict(), head=st.head.name)), 201


@bp.post("/structures/<sid>/approve")
@require("fees", "Approve")
def approve_structure(sid):
    s = db(); st = s.get(FeeStructure, sid)
    if not st: raise NotFound("Structure not found.")
    if st.status != "Draft": raise Conflict(f"Structure is {st.status}.")
    if st.created_by == g.user.id: raise PolicyViolation("Maker cannot approve own fee structure.")
    for old in s.query(FeeStructure).filter_by(branch_id=st.branch_id, academic_year=st.academic_year, class_name=st.class_name, head_id=st.head_id, status="Approved").all():
        old.status = "Retired"
    st.status = "Approved"; st.approved_by = g.user.id
    audit.record(s, "fees", "Fee structure approved", entity="fee_structure", entity_id=sid, branch_id=st.branch_id, new={"version": st.version}); s.commit()
    return ok(dict(st.to_dict(), head=st.head.name))


@bp.get("/students/<sid>/balance")
@require("fees", "View")
def balance(sid):
    s = db(); st = s.get(Student, sid)
    if not st: raise NotFound("Student not found.")
    assert_scope(st.branch_id)
    return ok(svc.student_balance(s, sid, request.args.get("academic_year")))


@bp.get("/modes")
def modes():
    return ok(PAYMENT_MODES)


@bp.get("/receipts")
@require("fees", "View")
def receipts():
    s = db(); limit, offset = page_args(); q = scope_filter(s.query(Receipt), Receipt.branch_id)
    a = request.args
    if a.get("branch_id"): q = q.filter(Receipt.branch_id == a["branch_id"])
    if a.get("student_id"): q = q.filter(Receipt.student_id == a["student_id"])
    if a.get("date"): q = q.filter(Receipt.receipt_date == as_date(a["date"], "date"))
    if a.get("from"): q = q.filter(Receipt.receipt_date >= as_date(a["from"], "from"))
    if a.get("to"): q = q.filter(Receipt.receipt_date <= as_date(a["to"], "to"))
    if a.get("mine") == "1": q = q.filter(Receipt.cashier_id == g.user.id)
    total = q.count()
    return ok([_rdto(r) for r in q.order_by(Receipt.created_at.desc()).offset(offset).limit(limit).all()], total=total)


def _rdto(r: Receipt):
    return dict(r.to_dict(), student=r.student.name, admission_no=r.student.admission_no, lines=[{"head": l.head_name, "amount": l.amount} for l in r.lines], signature_valid=svc.verify_signature(r))


@bp.post("/receipts")
@require("fees", "Add")
def collect():
    d = body(); need(d, "student_id", "lines", "mode"); one_of(d["mode"], PAYMENT_MODES, "mode"); s = db()
    st = s.get(Student, d["student_id"])
    if not st: raise NotFound("Student not found.")
    assert_scope(st.branch_id)
    r = svc.collect(s, student_id=d["student_id"], lines=d["lines"], mode=d["mode"], reference=d.get("reference"), receipt_date=as_date(d["receipt_date"], "receipt_date") if d.get("receipt_date") else None)
    s.commit(); return ok(_rdto(r)), 201


@bp.get("/receipts/<rid>")
@require("fees", "View")
def receipt(rid):
    s = db(); r = s.get(Receipt, rid)
    if not r: raise NotFound("Receipt not found.")
    assert_scope(r.branch_id); return ok(_rdto(r))


@bp.post("/receipts/<rid>/cancel")
@require("fees", "Delete")
def cancel(rid):
    d = body(); need(d, "reason"); s = db(); r = s.get(Receipt, rid)
    if not r: raise NotFound("Receipt not found.")
    assert_scope(r.branch_id); svc.cancel_receipt(s, rid, d["reason"]); s.commit(); return ok(_rdto(r))


@bp.get("/concessions")
@require("fees", "View")
def concessions():
    s = db(); q = s.query(Concession).join(Student, Student.id == Concession.student_id); q = scope_filter(q, Student.branch_id)
    if request.args.get("status"): q = q.filter(Concession.status == request.args["status"])
    return ok([dict(c.to_dict(), student=s.get(Student, c.student_id).name) for c in q.order_by(Concession.created_at.desc()).all()])


@bp.post("/concessions")
@require("fees", "Add")
def add_concession():
    d = body(); need(d, "student_id", "kind", "amount"); s = db(); st = s.get(Student, d["student_id"])
    if not st: raise NotFound("Student not found.")
    assert_scope(st.branch_id)
    from flask import current_app
    c = Concession(student_id=st.id, academic_year=d.get("academic_year") or current_app.config["ACADEMIC_YEAR"], kind=d["kind"], amount=float(as_money(d["amount"], "amount", 1)), document=d.get("document"), status="Requested", reason=d.get("reason"), created_by=g.user.id)
    if not c.document: raise PolicyViolation("Supporting document reference is mandatory for a concession.")
    s.add(c); audit.record(s, "fees", "Concession requested", entity="concession", entity_id=c.id, branch_id=st.branch_id, new=d); s.commit(); return ok(c.to_dict()), 201


@bp.post("/concessions/<cid>/decide")
@require("fees", "Approve")
def decide_concession(cid):
    d = body(); s = db(); c = svc.decide_concession(s, cid, bool(d.get("approve")), d.get("note")); s.commit(); return ok(c.to_dict())


@bp.get("/refunds")
@require("fees", "View")
def refunds():
    s = db(); q = s.query(Refund).join(Student, Student.id == Refund.student_id); q = scope_filter(q, Student.branch_id)
    if request.args.get("status"): q = q.filter(Refund.status == request.args["status"])
    return ok([dict(r.to_dict(), student=s.get(Student, r.student_id).name) for r in q.order_by(Refund.created_at.desc()).all()])


@bp.post("/refunds")
@require("fees", "Add")
def add_refund():
    d = body(); need(d, "student_id", "amount", "reason"); s = db(); st = s.get(Student, d["student_id"])
    if not st: raise NotFound("Student not found.")
    assert_scope(st.branch_id)
    if len(d["reason"].strip()) < 10: raise PolicyViolation("Refund reason must be at least 10 characters.")
    amt = float(as_money(d["amount"], "amount", 1))
    paid = float(sum(x.total for x in s.query(Receipt).filter_by(student_id=st.id, status="Paid").all()))
    refunded = float(sum(x.amount for x in s.query(Refund).filter(Refund.student_id == st.id, Refund.status != "Rejected").all()))
    if amt > paid - refunded + 0.005: raise PolicyViolation(f"Refund ₹{amt:,.0f} exceeds net paid ₹{paid - refunded:,.0f}.")
    r = Refund(no=next_no(s, "RFD", st.branch.code), student_id=st.id, receipt_id=d.get("receipt_id"), amount=amt, reason=d["reason"], status="Requested", requested_by=g.user.id, created_by=g.user.id)
    s.add(r); audit.record(s, "fees", "Refund requested", entity="refund", entity_id=r.id, branch_id=st.branch_id, new=d); s.commit(); return ok(r.to_dict()), 201


@bp.post("/refunds/<rid>/transition")
@require("fees", "Approve")
def refund_transition(rid):
    d = body(); need(d, "to"); s = db(); r = svc.refund_transition(s, rid, d["to"], d.get("note")); s.commit(); return ok(r.to_dict())
