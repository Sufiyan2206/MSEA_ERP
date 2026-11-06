"""HR: leave approval, payroll run computation and bank file (NEFT CSV)."""
import csv
import io
from calendar import monthrange
from datetime import date

from flask import g
from sqlalchemy import func

from app.core.errors import Conflict, NotFound, PolicyViolation
from app.models import Employee, LeaveRequest, PayrollLine, PayrollRun, StaffAttendance
from app.services import audit, notify

PAYROLL_FLOW = ["Draft", "Finance verified", "CFO approved", "Bank file generated", "Paid"]


def decide_leave(s, lid: str, approve: bool, note: str | None) -> LeaveRequest:
    l = s.get(LeaveRequest, lid)
    if not l:
        raise NotFound("Leave request not found.")
    if l.status != "Requested":
        raise Conflict(f"Leave already {l.status}.")
    emp = s.get(Employee, l.employee_id)
    if emp and emp.user_id == g.user.id:
        raise PolicyViolation("You cannot approve your own leave.")
    l.status = "Approved" if approve else "Rejected"; l.decided_by = g.user.id; l.decision_note = note
    audit.record(s, "hr", f"Leave {l.status}", entity="leave", entity_id=l.id, branch_id=emp.branch_id if emp else None, reason=note)
    if emp and emp.user_id:
        notify.notify_users(s, [emp.user_id], f"Your leave {l.from_date}–{l.to_date} was {l.status.lower()}" + (f": {note}" if note else ""), route="/hr/leave")
    return l


def compute_payroll(s, ym: str, branch_id: str | None) -> PayrollRun:
    """Draft run: pro-rata gross on paid days (present + approved leave + weekly offs),
    statutory deductions with simple Indian defaults (PF 12% of 50% basic capped, ESI 0.75% below 21k, PT slab)."""
    if s.query(PayrollRun).filter_by(ym=ym, branch_id=branch_id).filter(PayrollRun.status != "Rejected").first():
        raise Conflict(f"Payroll run for {ym} already exists.")
    y, m = int(ym[:4]), int(ym[5:7]); days_in_month = monthrange(y, m)[1]
    first, last = date(y, m, 1), date(y, m, days_in_month)
    q = s.query(Employee).filter(Employee.status == "Active", Employee.doj <= last)
    if branch_id:
        q = q.filter(Employee.branch_id == branch_id)
    run = PayrollRun(ym=ym, branch_id=branch_id, status="Draft", created_by=g.user.id)
    s.add(run); s.flush()
    tot = {"gross": 0, "pf": 0, "esi": 0, "pt": 0, "tds": 0, "net": 0, "employees": 0}
    for e in q.all():
        absent = s.query(func.count()).select_from(StaffAttendance).filter(StaffAttendance.employee_id == e.id, StaffAttendance.att_date.between(first, last), StaffAttendance.status == "A").scalar() or 0
        lop = 0
        for d in s.query(StaffAttendance.att_date).filter(StaffAttendance.employee_id == e.id, StaffAttendance.att_date.between(first, last), StaffAttendance.status == "A").all():
            ok = s.query(LeaveRequest).filter(LeaveRequest.employee_id == e.id, LeaveRequest.status == "Approved", LeaveRequest.from_date <= d[0], LeaveRequest.to_date >= d[0]).first()
            if not ok:
                lop += 1
        days_paid = days_in_month - lop
        ctc = float(e.ctc); monthly = ctc / 12
        gross = round(monthly * days_paid / days_in_month, 2)
        basic = gross * 0.5
        pf = round(min(basic, 15000) * 0.12, 2) if e.category != "Consultant" else 0
        esi = round(gross * 0.0075, 2) if gross <= 21000 else 0
        pt = 200 if gross > 20000 else (150 if gross > 15000 else 0)
        tds = round(max(0, (ctc - 700000)) * 0.1 / 12, 2) if ctc > 700000 else 0
        net = round(gross - pf - esi - pt - tds, 2)
        prev = s.query(PayrollLine).join(PayrollRun).filter(PayrollLine.employee_id == e.id, PayrollRun.status == "Paid").order_by(PayrollRun.ym.desc()).first()
        flag = None
        if prev and prev.net and abs(net - float(prev.net)) / float(prev.net) > 0.15:
            flag = f"Net changed {((net - float(prev.net)) / float(prev.net)) * 100:+.0f}% vs last paid month"
        if not e.bank_account or not e.bank_ifsc:
            flag = (flag + "; " if flag else "") + "Bank details missing"
        s.add(PayrollLine(run_id=run.id, employee_id=e.id, days_paid=days_paid, gross=gross, pf=pf, esi=esi, pt=pt, tds=tds, other_deductions=0, net=net, variance_flag=flag, excluded=False))
        for k, v in (("gross", gross), ("pf", pf), ("esi", esi), ("pt", pt), ("tds", tds), ("net", net)):
            tot[k] = round(tot[k] + v, 2)
        tot["employees"] += 1
    run.totals = tot
    audit.record(s, "hr", "Payroll computed", entity="payroll", entity_id=run.id, branch_id=branch_id, new=tot)
    return run


def payroll_transition(s, run_id: str, to: str, note: str | None) -> PayrollRun:
    r = s.get(PayrollRun, run_id)
    if not r:
        raise NotFound("Payroll run not found.")
    i = PAYROLL_FLOW.index(r.status) if r.status in PAYROLL_FLOW else -1
    if to == "Rejected":
        if r.status in ("Paid",):
            raise Conflict("Paid payroll cannot be rejected.")
        if len((note or "").strip()) < 10:
            raise PolicyViolation("Rejection needs a reason.")
    elif i < 0 or to != PAYROLL_FLOW[min(i + 1, len(PAYROLL_FLOW) - 1)] or to == r.status:
        raise Conflict(f"From {r.status} the next step is {PAYROLL_FLOW[i + 1] if i + 1 < len(PAYROLL_FLOW) else 'none'}.")
    if to == "Finance verified":
        if r.created_by == g.user.id:
            raise PolicyViolation("The person who computed payroll cannot verify it.")
        flagged = [l for l in r.lines if l.variance_flag and not l.excluded]
        if flagged and not note:
            raise PolicyViolation(f"{len(flagged)} lines carry variance flags; add a verification note or exclude them.")
        r.verified_by = g.user.id
    if to == "CFO approved":
        if g.user.id in (r.created_by, r.verified_by):
            raise PolicyViolation("Approver must be different from the maker and verifier.")
        r.approved_by = g.user.id
    if to == "Bank file generated":
        r.bank_file_name = f"NEFT_{r.ym}_{(r.branch_id or 'ALL')[:8]}.csv"
    old = r.status; r.status = to
    audit.record(s, "hr", f"Payroll {to}", entity="payroll", entity_id=r.id, branch_id=r.branch_id, old={"status": old}, new={"status": to}, reason=note)
    return r


def bank_file(s, run: PayrollRun) -> str:
    if PAYROLL_FLOW.index(run.status) < PAYROLL_FLOW.index("Bank file generated"):
        raise PolicyViolation("Bank file is available only after CFO approval.")
    buf = io.StringIO(); w = csv.writer(buf)
    w.writerow(["Beneficiary Name", "Account Number", "IFSC", "Amount", "Narration"])
    for l in run.lines:
        if l.excluded or float(l.net) <= 0:
            continue
        e = s.get(Employee, l.employee_id)
        w.writerow([e.name, e.bank_account or "", e.bank_ifsc or "", f"{float(l.net):.2f}", f"Salary {run.ym} {e.emp_code}"])
    return buf.getvalue()
