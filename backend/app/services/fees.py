"""Fee operations: demand generation, receipts, cancellation, concessions, refunds,
cashier closing and cash handover. Every rule the old single-file app enforced in
the browser is enforced here, server side.
"""
import hashlib
import hmac
from datetime import date, datetime, timedelta
from decimal import Decimal

from flask import current_app, g
from sqlalchemy import func

from app.core.errors import Conflict, NotFound, PolicyViolation
from app.models import (Branch, CashHandover, CashierClosing, Concession, FeeDemand, FeeStructure, Receipt, ReceiptLine, Refund,
                        Student, User)
from app.services import audit, notify
from app.services.numbering import next_no


# ---------------------------------------------------------------- demands ---
def generate_demands(s, student: Student, ay: str) -> list[FeeDemand]:
    """Create one FeeDemand per approved structure head × instalment for the student.
    Idempotent: existing (student, ay, head, instalment) rows are left untouched."""
    structs = s.query(FeeStructure).filter_by(branch_id=student.branch_id, academic_year=ay, class_name=student.class_name, status="Approved").all()
    created = []
    for st in structs:
        for i in range(1, st.instalments + 1):
            exists = s.query(FeeDemand).filter_by(student_id=student.id, academic_year=ay, head_id=st.head_id, instalment_no=i).first()
            if exists:
                continue
            start = int(ay[:4])
            # instalments spread evenly from June; 1 instalment = due in June
            month = 6 + ((i - 1) * (12 // max(st.instalments, 1)))
            yr = start + (month - 1) // 12
            due = date(yr, ((month - 1) % 12) + 1, 10)
            d = FeeDemand(student_id=student.id, academic_year=ay, head_id=st.head_id, instalment_no=i, due_date=due, amount=round(float(st.amount) / st.instalments, 2), concession=0, paid=0)
            s.add(d); created.append(d)
    s.flush()
    return created


def student_balance(s, student_id: str, ay: str | None = None) -> dict:
    q = s.query(FeeDemand).filter(FeeDemand.student_id == student_id)
    if ay:
        q = q.filter(FeeDemand.academic_year == ay)
    rows = q.all()
    today = date.today()
    total = float(sum(r.amount for r in rows)); conc = float(sum(r.concession for r in rows)); paid = float(sum(r.paid for r in rows))
    overdue = float(sum((r.amount - r.concession - r.paid) for r in rows if r.due_date < today and (r.amount - r.concession - r.paid) > 0))
    return {"total": round(total, 2), "concession": round(conc, 2), "paid": round(paid, 2), "balance": round(total - conc - paid, 2), "overdue": round(overdue, 2),
            "demands": [dict(r.to_dict(), head=r.head.name, balance=float(round(r.amount - r.concession - r.paid, 2))) for r in sorted(rows, key=lambda r: (r.due_date, r.instalment_no))]}


# ---------------------------------------------------------------- receipts --
def _sign(receipt: Receipt) -> str:
    msg = f"{receipt.no}|{receipt.student_id}|{receipt.total:.2f}|{receipt.receipt_date}|{receipt.mode}".encode()
    return hmac.new(current_app.config["SECRET_KEY"].encode(), msg, hashlib.sha256).hexdigest()[:24]


def verify_signature(receipt: Receipt) -> bool:
    return hmac.compare_digest(receipt.signature or "", _sign(receipt))


def collect(s, *, student_id: str, lines: list[dict], mode: str, reference: str | None, receipt_date: date | None = None) -> Receipt:
    """lines = [{demand_id, amount}]. Rules:
    - amount per line > 0 and <= demand balance (no over-collection)
    - non-cash modes need a reference
    - receipt date cannot be in the future or before the last cashier closing of the branch
    """
    student = s.get(Student, student_id)
    if not student:
        raise NotFound("Student not found.")
    if student.status not in ("Active", "Admitted"):
        raise PolicyViolation(f"Student is {student.status}; collection not allowed.")
    if mode != "Cash" and not (reference or "").strip():
        raise PolicyViolation("Reference / transaction id is mandatory for non-cash payments.")
    rd = receipt_date or date.today()
    if rd > date.today():
        raise PolicyViolation("Receipt date cannot be in the future.")
    last_close = s.query(func.max(CashierClosing.closing_date)).filter_by(branch_id=student.branch_id, cashier_id=g.user.id).scalar()
    if last_close and rd <= last_close:
        raise PolicyViolation(f"Your cash day {last_close} is already closed; receipt date must be after it.")
    if not lines:
        raise PolicyViolation("At least one fee line is required.")
    total = Decimal("0")
    rec_lines = []
    for ln in lines:
        d = s.get(FeeDemand, ln.get("demand_id"))
        if not d or d.student_id != student_id:
            raise PolicyViolation("Fee line does not belong to this student.")
        amt = Decimal(str(ln.get("amount", 0)))
        bal = Decimal(str(d.amount)) - Decimal(str(d.concession)) - Decimal(str(d.paid))
        if amt <= 0:
            raise PolicyViolation("Line amount must be positive.")
        if amt > bal + Decimal("0.005"):
            raise PolicyViolation(f"{d.head.name} instalment {d.instalment_no}: amount {amt} exceeds balance {bal}.")
        d.paid = float(Decimal(str(d.paid)) + amt)
        total += amt
        rec_lines.append(ReceiptLine(demand_id=d.id, head_name=f"{d.head.name} #{d.instalment_no}", amount=float(amt)))
    branch = s.get(Branch, student.branch_id)
    r = Receipt(no=next_no(s, "RCP", branch.code, rd), branch_id=student.branch_id, student_id=student_id, receipt_date=rd, total=float(total), mode=mode, reference=reference, cashier_id=g.user.id, status="Paid", created_by=g.user.id)
    r.signature = _sign(r)
    s.add(r); s.flush()
    for ln in rec_lines:
        ln.receipt_id = r.id; s.add(ln)
    audit.record(s, "fees", "Receipt issued", entity="receipt", entity_id=r.id, branch_id=r.branch_id, new={"no": r.no, "total": r.total, "mode": mode, "student": student.admission_no})
    return r


def cancel_receipt(s, receipt_id: str, reason: str) -> Receipt:
    r = s.get(Receipt, receipt_id)
    if not r:
        raise NotFound("Receipt not found.")
    if r.status == "Cancelled":
        raise Conflict("Receipt already cancelled.")
    if len(reason.strip()) < 10:
        raise PolicyViolation("Cancellation reason must be at least 10 characters.")
    closed = s.query(CashierClosing).filter_by(branch_id=r.branch_id, closing_date=r.receipt_date, cashier_id=r.cashier_id, status="Verified").first()
    if closed:
        raise PolicyViolation("Cash day already verified; raise a refund instead of cancelling.")
    for ln in r.lines:
        if ln.demand_id:
            d = s.get(FeeDemand, ln.demand_id); d.paid = float(d.paid) - float(ln.amount)
    r.status = "Cancelled"; r.cancel_reason = reason; r.cancelled_by = g.user.id
    audit.record(s, "fees", "Receipt cancelled", entity="receipt", entity_id=r.id, branch_id=r.branch_id, old={"status": "Paid"}, new={"status": "Cancelled"}, reason=reason)
    notify.notify_roles(s, ["Branch Accountant", "Principal"], f"Receipt {r.no} (₹{float(r.total):,.0f}) cancelled: {reason}", branch_id=r.branch_id, ref=r.id, route=f"/fees/receipts/{r.id}")
    return r


# ------------------------------------------------------------- concessions --
def decide_concession(s, cid: str, approve: bool, note: str | None):
    c = s.get(Concession, cid)
    if not c:
        raise NotFound("Concession not found.")
    if c.status != "Requested":
        raise Conflict(f"Concession already {c.status}.")
    if c.created_by == g.user.id:
        raise PolicyViolation("Maker cannot approve their own concession (4-eyes rule).")
    c.status = "Approved" if approve else "Rejected"; c.decided_by = g.user.id; c.reason = (c.reason or "") + (f" | decision: {note}" if note else "")
    if approve:
        # apply against the earliest open demands
        remaining = Decimal(str(c.amount))
        for d in s.query(FeeDemand).filter_by(student_id=c.student_id, academic_year=c.academic_year).order_by(FeeDemand.due_date).all():
            bal = Decimal(str(d.amount)) - Decimal(str(d.concession)) - Decimal(str(d.paid))
            if bal <= 0 or remaining <= 0:
                continue
            take = min(bal, remaining); d.concession = float(Decimal(str(d.concession)) + take); remaining -= take
        if remaining > 0:
            raise PolicyViolation(f"Concession exceeds open balance by {remaining}.")
    audit.record(s, "fees", f"Concession {c.status}", entity="concession", entity_id=c.id, new={"amount": c.amount}, reason=note)
    return c


# ----------------------------------------------------------------- refunds --
def refund_transition(s, rid: str, to: str, note: str | None) -> Refund:
    r = s.get(Refund, rid)
    if not r:
        raise NotFound("Refund not found.")
    allowed = {"Requested": {"Approved", "Rejected"}, "Approved": {"Paid"}}
    if to not in allowed.get(r.status, set()):
        raise Conflict(f"Cannot move refund from {r.status} to {to}.")
    if to in ("Approved", "Rejected") and r.requested_by == g.user.id:
        raise PolicyViolation("Maker cannot approve their own refund (4-eyes rule).")
    if to == "Paid" and r.approved_by == g.user.id:
        raise PolicyViolation("Approver cannot also pay the refund (segregation of duties).")
    old = r.status; r.status = to
    if to == "Approved": r.approved_by = g.user.id
    if to == "Paid": r.paid_by = g.user.id; r.paid_on = date.today()
    audit.record(s, "fees", f"Refund {to}", entity="refund", entity_id=r.id, old={"status": old}, new={"status": to}, reason=note)
    return r


# ---------------------------------------------------------- cashier closing --
def expected_cash(s, branch_id: str, cashier_id: str, d: date) -> float:
    v = s.query(func.coalesce(func.sum(Receipt.total), 0)).filter_by(branch_id=branch_id, cashier_id=cashier_id, receipt_date=d, mode="Cash", status="Paid").scalar()
    return float(v or 0)


def close_day(s, *, branch_id: str, closing_date: date, denominations: dict, reason: str | None) -> tuple[CashierClosing, CashHandover | None]:
    """Cashier counts notes; system compares with receipts. Difference needs a reason.
    Automation: a balanced (or explained) closing auto-creates a cash handover to the
    Branch Accountant (auAutoHandover in the old app)."""
    if s.query(CashierClosing).filter_by(branch_id=branch_id, closing_date=closing_date, cashier_id=g.user.id).first():
        raise Conflict("This cash day is already closed.")
    counted = sum(float(k) * int(v or 0) for k, v in (denominations or {}).items())
    expected = expected_cash(s, branch_id, g.user.id, closing_date)
    diff = round(counted - expected, 2)
    if abs(diff) > 0.5 and len((reason or "").strip()) < 10:
        raise PolicyViolation(f"Counted ₹{counted:,.0f} vs expected ₹{expected:,.0f}: difference needs a reason (10+ chars).")
    c = CashierClosing(branch_id=branch_id, closing_date=closing_date, cashier_id=g.user.id, expected=expected, counted=counted, difference=diff, denominations=denominations, reason=reason, status="Submitted", created_by=g.user.id)
    s.add(c); s.flush()
    audit.record(s, "cash", "Cash day closed", entity="closing", entity_id=c.id, branch_id=branch_id, new={"expected": expected, "counted": counted, "difference": diff}, reason=reason)
    ho = None
    if counted > 0:
        branch = s.get(Branch, branch_id)
        ho = CashHandover(no=next_no(s, "HO", branch.code, closing_date), branch_id=branch_id, handover_date=closing_date, from_user_id=g.user.id, amount=counted, denominations=denominations, state="Submitted", auto=True, note=f"Auto-created from closing {closing_date}", created_by=g.user.id)
        s.add(ho); s.flush()
        audit.record(s, "cash", "Handover auto-created", entity="handover", entity_id=ho.id, branch_id=branch_id, new={"no": ho.no, "amount": counted})
        notify.notify_roles(s, ["Branch Accountant"], f"Cash handover {ho.no} ₹{counted:,.0f} awaiting acceptance", branch_id=branch_id, ref=ho.id, route="/cash/handovers", kind="action")
    if abs(diff) > 0.5:
        notify.notify_roles(s, ["Branch Accountant", "Principal"], f"Cash difference ₹{diff:,.0f} on {closing_date}: {reason}", branch_id=branch_id, ref=c.id, route="/cash/closing", kind="warn")
    return c, ho


def handover_transition(s, hid: str, to: str, *, accepted_amount: float | None = None, deposit_ref: str | None = None, note: str | None = None) -> CashHandover:
    h = s.get(CashHandover, hid)
    if not h:
        raise NotFound("Handover not found.")
    allowed = {"Submitted": {"Accepted", "Rejected"}, "Accepted": {"Deposited"}}
    if to not in allowed.get(h.state, set()):
        raise Conflict(f"Cannot move handover from {h.state} to {to}.")
    if to in ("Accepted", "Rejected") and h.from_user_id == g.user.id:
        raise PolicyViolation("The cashier who handed over cannot accept it.")
    old = h.state
    if to == "Accepted":
        amt = float(accepted_amount if accepted_amount is not None else float(h.amount))
        if abs(amt - float(h.amount)) > 0.5 and len((note or "").strip()) < 10:
            raise PolicyViolation("Accepted amount differs from handed-over amount: give a reason.")
        h.accepted_by = g.user.id; h.accepted_amount = amt; h.accepted_at = datetime.utcnow()
    if to == "Deposited":
        if not (deposit_ref or "").strip():
            raise PolicyViolation("Bank deposit reference is mandatory.")
        h.deposit_ref = deposit_ref; h.deposited_at = datetime.utcnow()
    if to == "Rejected" and len((note or "").strip()) < 10:
        raise PolicyViolation("Rejection needs a reason.")
    h.state = to; h.note = note or h.note
    audit.record(s, "cash", f"Handover {to}", entity="handover", entity_id=h.id, branch_id=h.branch_id, old={"state": old}, new={"state": to, "accepted_amount": h.accepted_amount, "deposit_ref": h.deposit_ref}, reason=note)
    notify.notify_users(s, [h.from_user_id], f"Handover {h.no} {to.lower()}" + (f": {note}" if note else ""), ref=h.id, route="/cash/handovers")
    return h
