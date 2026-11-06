"""Seed roles, permissions, demo organisation and demo data.

    python -m scripts.seed            # roles/permissions/gap rules + demo data
    python -m scripts.seed --no-demo  # only roles, permissions, gap rules, super admin

Idempotent: re-running updates permissions and never duplicates master rows.
Default users (password `Msea@12345`, forced change on first login):
    superadmin, ceo, cfo, principal.hyd, accountant.hyd, cashier.hyd, counsellor.hyd,
    teacher.hyd, hr, auditor, parent.demo
"""
import random
import sys
from datetime import date, timedelta

from app import create_app
from app.core.db import session_scope
from app.core.security import hash_password
from app.models import (AcademicYear, Branch, Employee, Entity, FeeDemand, FeeHead, FeeStructure, Lead, Receipt, ReceiptLine, Role, RolePermission, Section, StaffAttendance,
                        Student, StudentAttendance, User)
from app.services.gap_engine import seed_rules
from app.services.numbering import next_no

ALL = ["View", "Add", "Edit", "Verify", "Approve", "Reject", "Delete", "Export", "Configure Settings"]
V, VA, VAE = ["View"], ["View", "Add"], ["View", "Add", "Edit"]
MODULES = ["dashboard", "admin", "audit", "students", "admissions", "fees", "cash", "attendance", "hr", "payroll", "gaps", "tasks", "reports", "legacy"]

# role -> {module: actions}
ROLES = {
    "Super Admin": {m: ALL for m in MODULES},
    "CEO": {"dashboard": V, "audit": V, "students": V, "admissions": V, "fees": V, "cash": V, "attendance": V, "hr": V, "payroll": ["View", "Approve"], "gaps": ["View", "Edit", "Approve", "Configure Settings"], "tasks": V, "reports": ["View", "Add", "Export"]},
    "CFO": {"dashboard": V, "audit": V, "students": V, "fees": ["View", "Approve", "Export"], "cash": ["View", "Verify"], "hr": V, "payroll": ["View", "Verify", "Approve", "Reject", "Export"], "gaps": ["View", "Edit", "Approve"], "tasks": V, "reports": ["View", "Add", "Export"]},
    "Regional Head": {"dashboard": V, "students": V, "admissions": V, "fees": V, "cash": V, "attendance": V, "hr": V, "gaps": ["View", "Edit", "Approve"], "tasks": V, "reports": ["View", "Add", "Export"]},
    "Principal": {"dashboard": V, "students": VAE, "admissions": ["View", "Add", "Edit", "Approve"], "fees": ["View", "Approve"], "cash": ["View", "Verify"], "attendance": VAE, "hr": ["View", "Add", "Approve"], "gaps": ["View", "Edit", "Approve"], "tasks": V, "reports": ["View", "Add", "Export"]},
    "Branch Accountant": {"dashboard": V, "students": V, "fees": ["View", "Add", "Approve", "Delete", "Export"], "cash": ["View", "Add", "Verify"], "gaps": ["View", "Edit"], "tasks": V, "reports": ["View", "Add", "Export"]},
    "Fee Collector": {"dashboard": V, "students": V, "fees": ["View", "Add"], "cash": ["View", "Add"], "gaps": ["View", "Edit"], "tasks": V},
    "Admission Counsellor": {"dashboard": V, "students": V, "admissions": VAE, "gaps": ["View", "Edit"], "tasks": V},
    "Class Teacher": {"dashboard": V, "students": V, "attendance": VAE, "gaps": ["View", "Edit"], "tasks": V},
    "HR Manager": {"dashboard": V, "hr": ["View", "Add", "Edit", "Approve", "Export"], "payroll": ["View", "Add", "Verify", "Export"], "gaps": ["View", "Edit"], "tasks": V, "reports": ["View", "Export"]},
    "Finance Manager": {"dashboard": V, "fees": ["View", "Approve", "Export"], "cash": ["View", "Verify"], "payroll": ["View", "Verify"], "gaps": ["View", "Edit", "Approve"], "tasks": V, "reports": ["View", "Add", "Export"]},
    "Internal Auditor": {"dashboard": V, "audit": V, "students": V, "fees": V, "cash": V, "hr": V, "payroll": V, "gaps": ["View", "Edit"], "reports": ["View", "Add", "Export"]},
    "System Admin": {"dashboard": V, "admin": ALL, "audit": V, "gaps": ["View", "Edit"]},
    "Parent": {},
    "Staff": {"tasks": V},
}

BRANCHES = [("HYD", "MS Education Academy Hyderabad", "South", "Telangana", "Hyderabad", 1200), ("SEC", "MS Education Academy Secunderabad", "South", "Telangana", "Secunderabad", 900),
            ("BLR", "MS Education Academy Bengaluru", "South", "Karnataka", "Bengaluru", 1000), ("MUM", "MS Education Academy Mumbai", "West", "Maharashtra", "Mumbai", 800)]
CLASSES = ["Nursery", "LKG", "UKG"] + [f"Class {i}" for i in range(1, 11)]
HEADS = [("TUI", "Tuition fee", 60000, 4), ("ADM", "Admission fee", 10000, 1), ("TRN", "Transport fee", 18000, 2), ("LAB", "Lab & activity fee", 6000, 1)]
FIRST = ["Aarav", "Ayaan", "Fatima", "Zara", "Imran", "Sana", "Rehan", "Hiba", "Omar", "Maryam", "Yusuf", "Aisha", "Hamza", "Noor", "Arjun", "Diya", "Kabir", "Ananya", "Rohan", "Meera"]
LAST = ["Khan", "Ahmed", "Siddiqui", "Ali", "Shaikh", "Hussain", "Reddy", "Rao", "Sharma", "Patel", "Iyer", "Nair"]


for _r, _p in ROLES.items():
    if _r not in ("Parent",) and "legacy" not in _p:
        _p["legacy"] = ["View", "Add"]


def upsert_roles(s):
    roles = {}
    for name, perms in ROLES.items():
        r = s.query(Role).filter_by(name=name).first()
        if not r:
            r = Role(name=name, system=True); s.add(r); s.flush()
        s.query(RolePermission).filter_by(role_id=r.id).delete()
        for m, acts in perms.items():
            for a in acts: s.add(RolePermission(role_id=r.id, module=m, action=a))
        roles[name] = r
    return roles


def user(s, roles, username, name, role, branch=None, **kw):
    u = s.query(User).filter_by(username=username).first()
    if u: return u
    u = User(username=username, name=name, role_id=roles[role].id, branch_id=branch.id if branch else None, password_hash=hash_password("Msea@12345"), must_change_password=True, email=f"{username}@example.com", **kw)
    s.add(u); s.flush(); return u


def main(demo=True):
    app = create_app()
    with app.app_context(), session_scope() as s:
        roles = upsert_roles(s); seed_rules(s)
        if not s.query(AcademicYear).filter_by(code=app.config["ACADEMIC_YEAR"]).first():
            y = int(app.config["ACADEMIC_YEAR"][:4]); s.add(AcademicYear(code=app.config["ACADEMIC_YEAR"], starts_on=date(y, 6, 1), ends_on=date(y + 1, 4, 30), current=True))
        user(s, roles, "superadmin", "Super Admin", "Super Admin")
        if not demo:
            print("roles, permissions, rules, superadmin seeded"); return
        ent = s.query(Entity).filter_by(code="MSEA").first() or Entity(code="MSEA", name="MS Education Academy Trust"); s.add(ent); s.flush()
        branches = []
        for code, name, region, state, city, cap in BRANCHES:
            b = s.query(Branch).filter_by(code=code).first()
            if not b: b = Branch(code=code, name=name, entity_id=ent.id, region=region, zone=region, state=state, city=city, kind="School", capacity=cap, active=True); s.add(b); s.flush()
            branches.append(b)
        if s.query(Student).count() > 0:
            print("demo data already present"); return
        heads = []
        for code, name, amt, inst in HEADS:
            h = s.query(FeeHead).filter_by(code=code).first() or FeeHead(code=code, name=name, refundable=code != "ADM"); s.add(h); s.flush(); heads.append((h, amt, inst))
        ay = app.config["ACADEMIC_YEAR"]
        hyd = branches[0]
        user(s, roles, "ceo", "Dr. M. S. Rahman", "CEO"); user(s, roles, "cfo", "Nadia Farooq", "CFO"); user(s, roles, "hr", "Kiran Kumar", "HR Manager"); user(s, roles, "auditor", "Priya Menon", "Internal Auditor")
        user(s, roles, "finance", "Sameer Qureshi", "Finance Manager"); user(s, roles, "sysadmin", "Vikram Singh", "System Admin")
        for b in branches:
            sfx = b.code.lower()
            pr = user(s, roles, f"principal.{sfx}", f"Principal {b.city}", "Principal", b); acc = user(s, roles, f"accountant.{sfx}", f"Accountant {b.city}", "Branch Accountant", b)
            cash = user(s, roles, f"cashier.{sfx}", f"Cashier {b.city}", "Fee Collector", b); user(s, roles, f"counsellor.{sfx}", f"Counsellor {b.city}", "Admission Counsellor", b)
            tch = user(s, roles, f"teacher.{sfx}", f"Teacher {b.city}", "Class Teacher", b)
            for h, amt, inst in heads:
                mult = 1.0 if b.code in ("HYD", "SEC") else 1.15
                for cls in CLASSES:
                    s.add(FeeStructure(branch_id=b.id, academic_year=ay, class_name=cls, head_id=h.id, amount=round(amt * mult * (1 + CLASSES.index(cls) * 0.03)), instalments=inst, version=1, status="Approved", approved_by=pr.id))
            emps = []
            for i in range(12):
                e = Employee(emp_code=f"{b.code}-E{i + 1:03d}", name=f"{random.choice(FIRST)} {random.choice(LAST)}", branch_id=b.id, department="Academics" if i < 9 else "Admin", designation="Teacher" if i < 9 else "Office staff", category="Teaching" if i < 9 else "Non-teaching",
                             doj=date(2020 + i % 5, 6, 1), status="Active", ctc=random.choice([300000, 360000, 420000, 540000, 720000]), bank_account=f"{random.randint(10**11, 10**12 - 1)}", bank_ifsc="HDFC0001234", mobile=f"9{random.randint(100000000, 999999999)}")
                s.add(e); emps.append(e)
            s.flush(); tch.employee_id = emps[0].id
            for cls in CLASSES:
                for sec in ("A", "B"): s.add(Section(branch_id=b.id, class_name=cls, name=sec, class_teacher_id=emps[0].id, capacity=40))
            s.flush()
            # students + demands + receipts + attendance
            stu_n = 60 if b.code == "HYD" else 35
            for i in range(stu_n):
                cls = random.choice(CLASSES)
                st = Student(admission_no=next_no(s, "ADM", b.code), name=f"{random.choice(FIRST)} {random.choice(LAST)}", branch_id=b.id, academic_year=ay, class_name=cls, section=random.choice("AB"), gender=random.choice("MF"), dob=date(2012 + CLASSES.index(cls) * -1 + 8, random.randint(1, 12), random.randint(1, 28)),
                             parent_name=f"{random.choice(FIRST)} {random.choice(LAST)}", mobile=f"9{random.randint(100000000, 999999999)}", status="Active", join_date=date(2026, 6, random.randint(1, 20)), source=random.choice(["Walk-in", "Referral", "Website", "Social media"]))
                s.add(st); s.flush()
                from app.services.fees import generate_demands
                from flask import g
                g.user = cash
                demands = generate_demands(s, st, ay)
                # pay 0–3 earliest demands in cash/UPI
                paid_n = random.choice([0, 1, 2, 2, 3, 3, 4])
                for d_ in sorted(demands, key=lambda x: x.due_date)[:paid_n]:
                    rd = min(d_.due_date - timedelta(days=random.randint(0, 20)), date.today())
                    rd = max(rd, date(2026, 6, 1))
                    r = Receipt(no=next_no(s, "RCP", b.code, rd), branch_id=b.id, student_id=st.id, receipt_date=rd, total=d_.amount, mode=random.choice(["Cash", "Cash", "UPI", "Card"]), reference=None, cashier_id=cash.id, status="Paid")
                    if r.mode != "Cash": r.reference = f"TXN{random.randint(10**9, 10**10 - 1)}"
                    s.add(r); s.flush(); d_.paid = d_.amount
                    s.add(ReceiptLine(receipt_id=r.id, demand_id=d_.id, head_name=f"{d_.head.name} #{d_.instalment_no}", amount=d_.amount))
                # 20 school days attendance
                dd = date.today()
                for k in range(28):
                    day = dd - timedelta(days=k)
                    if day.weekday() == 6: continue
                    s.add(StudentAttendance(student_id=st.id, branch_id=b.id, class_name=cls, section=st.section, att_date=day, period=0, status=random.choices(["P", "A", "L", "V"], [86, 8, 4, 2])[0], marked_by=tch.id))
            for e in emps:
                for k in range(28):
                    day = date.today() - timedelta(days=k)
                    if day.weekday() == 6: continue
                    s.add(StaffAttendance(employee_id=e.id, branch_id=b.id, att_date=day, status=random.choices(["P", "A", "L"], [92, 5, 3])[0], source="seed"))
            # leads
            for i in range(25 if b.code == "HYD" else 12):
                stage = random.choice(["New", "New", "Contacted", "Visited", "Application", "Documents", "SRF Paid", "Lost"])
                l = Lead(no=next_no(s, "ENQ", b.code), branch_id=b.id, name=f"{random.choice(FIRST)} {random.choice(LAST)}", class_name=random.choice(CLASSES), parent_name=f"{random.choice(FIRST)} {random.choice(LAST)}", mobile=f"8{random.randint(100000000, 999999999)}",
                         source=random.choice(["Walk-in", "Referral", "Website", "Social media"]), stage=stage, counsellor_id=s.query(User).filter_by(username=f"counsellor.{sfx}").first().id, next_follow_up=date.today() + timedelta(days=random.randint(-5, 7)), srf_paid=stage == "SRF Paid", srf_amount=5000 if stage == "SRF Paid" else 0, lost_reason="Fee too high" if stage == "Lost" else None)
                s.add(l)
        # a parent with two kids
        kids = [x.id for x in s.query(Student).filter_by(branch_id=hyd.id).limit(2).all()]
        user(s, roles, "parent.demo", "Demo Parent", "Parent", hyd, kids=kids)
        s.flush()
        print(f"seeded: {s.query(Student).count()} students, {s.query(Receipt).count()} receipts, {s.query(Lead).count()} leads, {s.query(User).count()} users")


if __name__ == "__main__":
    main(demo="--no-demo" not in sys.argv)
