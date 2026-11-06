from datetime import date, timedelta


def test_lead_pipeline_and_auto_onboarding(api):
    co = api("counsellor"); pr = api("principal"); bid = co.me["branch_id"]
    r = co.post("/admissions/leads", {"branch_id": bid, "name": "Zara Ali", "class_name": "Class 2", "mobile": "9000000001", "source": "Website"}); assert r.status_code == 201; l = r.get_json()["data"]
    assert co.post("/admissions/leads", {"branch_id": bid, "name": "Dup", "class_name": "Class 2", "mobile": "9000000001"}).status_code == 409
    assert co.post(f"/admissions/leads/{l['id']}/stage", {"to": "Visited"}).status_code == 422  # skip
    for st in ("Contacted", "Visited", "Application", "Documents"):
        assert co.post(f"/admissions/leads/{l['id']}/stage", {"to": st}).status_code == 200
    assert co.post(f"/admissions/leads/{l['id']}/stage", {"to": "SRF Paid"}).status_code == 422
    assert co.post(f"/admissions/leads/{l['id']}/stage", {"to": "SRF Paid", "srf_amount": 5000}).status_code == 200
    assert co.post(f"/admissions/leads/{l['id']}/stage", {"to": "Admitted"}).status_code == 403  # counsellor cannot admit
    r = pr.post(f"/admissions/leads/{l['id']}/stage", {"to": "Admitted"}); assert r.status_code == 200; d = r.get_json()["data"]
    assert d["student_id"] and d["admission_no"].startswith("ADM/HYD/")
    stu = pr.get(f"/students/{d['student_id']}").get_json()["data"]
    assert stu["section"] == "A" and stu["fees"]["total"] == 40000 and len(stu["fees"]["demands"]) == 4
    ev = pr.get(f"/admissions/leads/{l['id']}").get_json()["data"]["events"]; assert any(e["kind"] == "onboard" for e in ev)


def test_attendance_mark_and_correction(api):
    t = api("teacher"); bid = t.me["branch_id"]
    sheet = t.get(f"/attendance/students?branch_id={bid}&class_name=Class 1").get_json()["data"]; assert sheet["rows"]
    marks = [{"student_id": r["student_id"], "status": "P"} for r in sheet["rows"]]
    assert t.post("/attendance/students", {"branch_id": bid, "class_name": "Class 1", "marks": marks}).status_code == 200
    assert t.post("/attendance/students", {"branch_id": bid, "class_name": "Class 1", "marks": marks, "date": str(date.today() + timedelta(days=1))}).status_code == 422
    old = str(date.today() - timedelta(days=10))
    assert t.post("/attendance/students", {"branch_id": bid, "class_name": "Class 1", "marks": marks, "date": old}).status_code == 422  # correction needs reason
    assert t.post("/attendance/students", {"branch_id": bid, "class_name": "Class 1", "marks": marks, "date": old, "reason": "register found later"}).status_code == 200
    sm = t.get(f"/attendance/students/{marks[0]['student_id']}/summary").get_json()["data"]; assert sm["present"] >= 2


def test_hr_leave_payroll_flow(api):
    hr = api("hr"); pr = api("principal"); cfo = api("cfo"); bid = pr.me["branch_id"]
    e = hr.post("/hr/employees", {"emp_code": "HYD-T1", "name": "Teacher One", "branch_id": bid, "doj": "2024-06-01", "ctc": 480000, "bank_account": "1234", "bank_ifsc": "HDFC0000001"}).get_json()["data"]
    assert hr.post("/hr/employees", {"emp_code": "HYD-T1", "name": "x", "doj": "2024-06-01", "ctc": 1}).status_code == 409
    l = hr.post("/hr/leave", {"employee_id": e["id"], "kind": "CL", "from_date": "2026-11-10", "to_date": "2026-11-11", "reason": "family"}).get_json()["data"]
    assert hr.post("/hr/leave", {"employee_id": e["id"], "kind": "CL", "from_date": "2026-11-11", "to_date": "2026-11-12", "reason": "overlap"}).status_code == 409
    assert pr.post(f"/hr/leave/{l['id']}/decide", {"approve": True}).status_code == 200
    run = hr.post("/hr/payroll", {"ym": "2026-10", "branch_id": bid}).get_json()["data"]; assert run["status"] == "Draft" and run["totals"]["employees"] >= 1
    assert hr.post(f"/hr/payroll/{run['id']}/transition", {"to": "CFO approved"}).status_code in (403, 409)
    assert hr.post(f"/hr/payroll/{run['id']}/transition", {"to": "Finance verified"}).status_code == 422  # maker cannot verify
    assert cfo.post(f"/hr/payroll/{run['id']}/transition", {"to": "Finance verified", "note": "checked"}).status_code == 200
    assert cfo.post(f"/hr/payroll/{run['id']}/transition", {"to": "CFO approved"}).status_code == 422  # verifier != approver
    sa = api("superadmin"); assert sa.post(f"/hr/payroll/{run['id']}/transition", {"to": "CFO approved"}).status_code == 200
    assert hr.get(f"/hr/payroll/{run['id']}/bank-file").status_code == 422
    assert sa.post(f"/hr/payroll/{run['id']}/transition", {"to": "Bank file generated"}).status_code == 200
    r = hr.get(f"/hr/payroll/{run['id']}/bank-file"); assert r.status_code == 200 and b"IFSC" in r.data


def test_gap_scan_escalation_and_transitions(app, api):
    sa = api("superadmin"); acc = api("accountant")
    # make an overdue demand so FEE-OD30 fires
    from app.core.db import SessionLocal
    from app.models import FeeDemand
    s = SessionLocal(); d = s.query(FeeDemand).first(); d.due_date = date.today() - timedelta(days=60); s.commit(); SessionLocal.remove()
    res = sa.post("/gaps/scan").get_json()["data"]; assert res["created"] >= 1
    res2 = sa.post("/gaps/scan").get_json()["data"]; assert res2["created"] == 0 and res2["updated"] >= 1  # dedupe
    gaps = sa.get("/gaps?rule_code=FEE-OD30").get_json()["data"]; assert gaps; gid = gaps[0]["id"]
    assert acc.post(f"/gaps/{gid}/transition", {"to": "Resolved"}).status_code == 409  # must acknowledge first
    assert acc.post(f"/gaps/{gid}/transition", {"to": "Acknowledged"}).status_code == 200
    assert acc.post(f"/gaps/{gid}/transition", {"to": "In progress"}).status_code == 200
    assert acc.post(f"/gaps/{gid}/transition", {"to": "Resolved", "note": "short"}).status_code == 422
    assert acc.post(f"/gaps/{gid}/transition", {"to": "Resolved", "note": "collected all overdue fees"}).status_code == 422  # High risk needs evidence
    r = acc.post(f"/gaps/{gid}/transition", {"to": "Resolved", "note": "collected all overdue fees", "file": "bank-slip.pdf"}); assert r.status_code == 200
    assert len(r.get_json()["data"]["history"]) >= 4
    summ = sa.get("/gaps/summary").get_json()["data"]; assert "compliance" in summ
    # escalation: force due date in the past and re-run
    s = SessionLocal()
    from app.models import GapRecord
    g_ = s.query(GapRecord).filter(GapRecord.state == "Open").first()
    if g_:
        g_.due_date = date.today() - timedelta(days=20); s.commit()
    SessionLocal.remove()
    sa.post("/gaps/scan")
    if g_:
        got = sa.get(f"/gaps/{g_.id}").get_json()["data"]; assert got["escalation_level"] >= 4


def test_reports_dashboard_tasks(api):
    cfo = api("cfo"); cash = api("cashier")
    ds = cfo.get("/reports/datasets").get_json()["data"]; assert any(d["key"] == "branch_scorecard" for d in ds)
    r = cfo.post("/reports/run", {"dataset": "fee_outstanding", "sort_by": "balance", "sort_desc": True}); assert r.status_code == 200
    r = cfo.post("/reports/export", {"dataset": "collections"}); assert r.status_code == 200 and r.mimetype == "text/csv"
    d = cfo.post("/reports/definitions", {"name": "Outstanding top", "dataset": "fee_outstanding", "schedule": {"hour": 7, "to": ["cfo@example.com"]}}); assert d.status_code == 201
    k = cfo.get("/dashboard/kpis").get_json()["data"]; assert "collection_mtd" in k and "compliance" in k
    b = cfo.get("/dashboard/brief").get_json()["data"]; assert b["headline"] and isinstance(b["branches"], list)
    cl = cash.get("/tasks/checklist").get_json()["data"]; assert cl and len(cl["items"]) == 4
    assert cash.post(f"/tasks/checklist/items/{cl['items'][0]['id']}", {"done": True}).status_code == 200
    assert cfo.get("/dashboard/search?q=HYD").status_code == 200
    assert api("cashier").get("/audit").status_code == 403
