"""Report builder datasets. Each dataset is a function (session, scope_branch_ids, filters) -> list[dict].
The frontend lists DATASETS to offer columns; the API applies columns/filters/group/sort.
Add a dataset = add a function and register it in DATASETS (see DEVELOPER-GUIDE)."""
from datetime import date, timedelta

from sqlalchemy import func

from app.models import (Branch, CashHandover, CashierClosing, Employee, FeeDemand, GapRecord, Lead, Receipt, StaffAttendance, Student,
                        StudentAttendance, User)


def _scope(q, col, branch_ids):
    return q if branch_ids is None else q.filter(col.in_(list(branch_ids)))


def ds_students(s, bids, f):
    q = _scope(s.query(Student), Student.branch_id, bids)
    return [dict(st.to_dict(exclude={"extra"}), branch=st.branch.name) for st in q.all()]


def ds_fee_outstanding(s, bids, f):
    today = date.today()
    q = (s.query(Student, func.sum(FeeDemand.amount), func.sum(FeeDemand.concession), func.sum(FeeDemand.paid),
                 func.sum(FeeDemand.amount - FeeDemand.concession - FeeDemand.paid))
         .join(FeeDemand, FeeDemand.student_id == Student.id).group_by(Student.id))
    q = _scope(q, Student.branch_id, bids)
    out = []
    for st, tot, conc, paid, bal in q.all():
        if bal and bal > 0.5:
            out.append({"admission_no": st.admission_no, "name": st.name, "branch": st.branch.name, "class_name": st.class_name, "section": st.section, "mobile": st.mobile, "total": float(tot), "concession": float(conc), "paid": float(paid), "balance": float(bal)})
    return out


def ds_collections(s, bids, f):
    q = _scope(s.query(Receipt), Receipt.branch_id, bids)
    if f.get("from"): q = q.filter(Receipt.receipt_date >= f["from"])
    if f.get("to"): q = q.filter(Receipt.receipt_date <= f["to"])
    return [{"no": r.no, "date": r.receipt_date.isoformat(), "branch": s.get(Branch, r.branch_id).name, "student": r.student.name, "admission_no": r.student.admission_no, "mode": r.mode, "total": r.total, "status": r.status, "cashier": (s.get(User, r.cashier_id) or User(name="?")).name} for r in q.order_by(Receipt.receipt_date.desc()).all()]


def ds_daily_collection_summary(s, bids, f):
    q = _scope(s.query(Receipt.branch_id, Receipt.receipt_date, Receipt.mode, func.sum(Receipt.total), func.count()).filter(Receipt.status == "Paid"), Receipt.branch_id, bids)
    rows = q.group_by(Receipt.branch_id, Receipt.receipt_date, Receipt.mode).order_by(Receipt.receipt_date.desc()).all()
    return [{"branch": s.get(Branch, b).name, "date": d.isoformat(), "mode": m, "amount": float(a), "receipts": n} for b, d, m, a, n in rows]


def ds_cash_closings(s, bids, f):
    q = _scope(s.query(CashierClosing), CashierClosing.branch_id, bids)
    return [dict(c.to_dict(exclude={"denominations"}), branch=s.get(Branch, c.branch_id).name, cashier=(s.get(User, c.cashier_id) or User(name="?")).name) for c in q.order_by(CashierClosing.closing_date.desc()).all()]


def ds_handovers(s, bids, f):
    q = _scope(s.query(CashHandover), CashHandover.branch_id, bids)
    return [dict(h.to_dict(exclude={"denominations"}), branch=s.get(Branch, h.branch_id).name) for h in q.order_by(CashHandover.handover_date.desc()).all()]


def ds_leads(s, bids, f):
    q = _scope(s.query(Lead), Lead.branch_id, bids)
    return [dict(l.to_dict(), branch=l.branch.name, counsellor=l.counsellor.name if l.counsellor else None) for l in q.all()]


def ds_admission_funnel(s, bids, f):
    q = _scope(s.query(Lead.branch_id, Lead.stage, func.count()), Lead.branch_id, bids).group_by(Lead.branch_id, Lead.stage)
    return [{"branch": s.get(Branch, b).name, "stage": st, "count": n} for b, st, n in q.all()]


def ds_student_attendance(s, bids, f):
    since = date.today() - timedelta(days=int(f.get("days", 30)))
    q = s.query(Student, func.count(StudentAttendance.id)).join(StudentAttendance, StudentAttendance.student_id == Student.id).filter(StudentAttendance.att_date >= since, StudentAttendance.period == 0).group_by(Student.id)
    q = _scope(q, Student.branch_id, bids)
    out = []
    for st, n in q.all():
        p = s.query(func.count()).select_from(StudentAttendance).filter(StudentAttendance.student_id == st.id, StudentAttendance.att_date >= since, StudentAttendance.period == 0, StudentAttendance.status.in_(["P", "L"])).scalar()
        out.append({"admission_no": st.admission_no, "name": st.name, "branch": st.branch.name, "class_name": st.class_name, "section": st.section, "days": n, "present": p, "pct": round(p * 100 / n, 1) if n else 0})
    return out


def ds_staff_attendance(s, bids, f):
    since = date.today() - timedelta(days=int(f.get("days", 30)))
    q = _scope(s.query(StaffAttendance), StaffAttendance.branch_id, bids).filter(StaffAttendance.att_date >= since)
    return [dict(a.to_dict(), employee=(s.get(Employee, a.employee_id) or Employee(name="?")).name) for a in q.all()]


def ds_employees(s, bids, f):
    q = _scope(s.query(Employee), Employee.branch_id, bids)
    return [dict(e.to_dict(exclude={"extra", "pan", "uan", "esi_no", "bank_account"}), branch=e.branch.name if e.branch else None) for e in q.all()]


def ds_gaps(s, bids, f):
    q = _scope(s.query(GapRecord), GapRecord.branch_id, bids)
    return [dict(g.to_dict(), branch=s.get(Branch, g.branch_id).name if g.branch_id else "All", owner=g.owner.name if g.owner else None) for g in q.all()]


def ds_branch_scorecard(s, bids, f):
    out = []
    for b in _scope(s.query(Branch).filter_by(active=True), Branch.id, bids).all():
        stu = s.query(func.count()).select_from(Student).filter_by(branch_id=b.id, status="Active").scalar()
        bal = s.query(func.coalesce(func.sum(FeeDemand.amount - FeeDemand.concession - FeeDemand.paid), 0)).join(Student, Student.id == FeeDemand.student_id).filter(Student.branch_id == b.id).scalar()
        mtd = s.query(func.coalesce(func.sum(Receipt.total), 0)).filter(Receipt.branch_id == b.id, Receipt.status == "Paid", Receipt.receipt_date >= date.today().replace(day=1)).scalar()
        gaps = s.query(func.count()).select_from(GapRecord).filter(GapRecord.branch_id == b.id, GapRecord.state.in_(["Open", "Acknowledged", "In progress"])).scalar()
        leads = s.query(func.count()).select_from(Lead).filter(Lead.branch_id == b.id, Lead.stage.notin_(["Admitted", "Lost"])).scalar()
        out.append({"branch": b.name, "code": b.code, "students": stu, "capacity": b.capacity, "fill_pct": round(stu * 100 / b.capacity, 1) if b.capacity else None, "outstanding": float(bal), "mtd_collection": float(mtd), "open_gaps": gaps, "open_enquiries": leads})
    return out


DATASETS = {
    "students": ("Students", ds_students), "fee_outstanding": ("Fee outstanding per student", ds_fee_outstanding), "collections": ("Receipts", ds_collections),
    "daily_collection_summary": ("Daily collection by mode", ds_daily_collection_summary), "cash_closings": ("Cashier closings", ds_cash_closings), "handovers": ("Cash handovers", ds_handovers),
    "leads": ("Enquiries", ds_leads), "admission_funnel": ("Admission funnel", ds_admission_funnel), "student_attendance": ("Student attendance %", ds_student_attendance),
    "staff_attendance": ("Staff attendance", ds_staff_attendance), "employees": ("Employees", ds_employees), "gaps": ("Gap records", ds_gaps), "branch_scorecard": ("Branch scorecard", ds_branch_scorecard),
}


def run_dataset(s, name: str, bids, filters: dict | None, columns=None, sort_by=None, sort_desc=False, group_by=None, limit=5000):
    if name not in DATASETS:
        from app.core.errors import NotFound
        raise NotFound(f"Unknown dataset {name}.")
    rows = DATASETS[name][1](s, bids, filters or {})
    for flt in (filters or {}).get("where", []) if isinstance(filters, dict) else []:
        col, op, val = flt.get("col"), flt.get("op", "eq"), flt.get("val")
        def keep(r):
            x = r.get(col)
            if op == "eq": return str(x) == str(val)
            if op == "ne": return str(x) != str(val)
            if op == "gt": return (x or 0) > float(val)
            if op == "lt": return (x or 0) < float(val)
            if op == "contains": return str(val).lower() in str(x or "").lower()
            return True
        rows = [r for r in rows if keep(r)]
    if group_by:
        agg = {}
        for r in rows:
            k = r.get(group_by)
            a = agg.setdefault(k, {group_by: k, "count": 0})
            a["count"] += 1
            for c, v in r.items():
                if isinstance(v, (int, float)) and not isinstance(v, bool) and c != group_by:
                    a[c] = round(a.get(c, 0) + v, 2)
        rows = list(agg.values())
    if sort_by:
        rows.sort(key=lambda r: (r.get(sort_by) is None, r.get(sort_by)), reverse=bool(sort_desc))
    rows = rows[:limit]
    if columns:
        rows = [{c: r.get(c) for c in columns} for r in rows]
    return rows
