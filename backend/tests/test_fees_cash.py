from datetime import date


def _student(a):
    return a.get("/students?q=HYD-0001").get_json()["data"][0]


def test_demands_and_collect_flow(api):
    cash = api("cashier"); st = _student(cash)
    bal = cash.get(f"/fees/students/{st['id']}/balance").get_json()["data"]
    if not bal["demands"]:
        cash.post(f"/students/{st['id']}/demands/generate"); bal = cash.get(f"/fees/students/{st['id']}/balance").get_json()["data"]
    assert len(bal["demands"]) == 4 and bal["total"] == 40000
    d0 = bal["demands"][0]
    # over-collection blocked
    r = cash.post("/fees/receipts", {"student_id": st["id"], "mode": "Cash", "lines": [{"demand_id": d0["id"], "amount": d0["balance"] + 1}]})
    assert r.status_code == 422
    # non-cash needs reference
    r = cash.post("/fees/receipts", {"student_id": st["id"], "mode": "UPI", "lines": [{"demand_id": d0["id"], "amount": 1000}]})
    assert r.status_code == 422 and "Reference" in r.get_json()["error"]["message"]
    r = cash.post("/fees/receipts", {"student_id": st["id"], "mode": "Cash", "lines": [{"demand_id": d0["id"], "amount": 10000}]})
    assert r.status_code == 201; rec = r.get_json()["data"]
    assert rec["no"].startswith("RCP/HYD/") and rec["signature_valid"] is True and rec["total"] == 10000
    bal2 = cash.get(f"/fees/students/{st['id']}/balance").get_json()["data"]; assert bal2["paid"] == 10000
    # teacher cannot see receipts, parent cannot either
    assert api("teacher").get(f"/fees/receipts/{rec['id']}").status_code == 403


def test_cancel_requires_reason_and_permission(api):
    cash = api("cashier"); acc = api("accountant"); st = _student(cash)
    bal = cash.get(f"/fees/students/{st['id']}/balance").get_json()["data"]; d = [x for x in bal["demands"] if x["balance"] > 0][0]
    rec = cash.post("/fees/receipts", {"student_id": st["id"], "mode": "Cash", "lines": [{"demand_id": d["id"], "amount": 500}]}).get_json()["data"]
    assert cash.post(f"/fees/receipts/{rec['id']}/cancel", {"reason": "duplicate entry made"}).status_code == 403  # cashier lacks Delete
    assert acc.post(f"/fees/receipts/{rec['id']}/cancel", {"reason": "short"}).status_code == 422
    r = acc.post(f"/fees/receipts/{rec['id']}/cancel", {"reason": "duplicate entry by cashier"}); assert r.status_code == 200 and r.get_json()["data"]["status"] == "Cancelled"
    assert acc.post(f"/fees/receipts/{rec['id']}/cancel", {"reason": "duplicate entry by cashier"}).status_code == 409


def test_closing_creates_handover_and_chain(api):
    cash = api("cashier"); acc = api("accountant"); cfo = api("cfo")
    exp = cash.get("/cash/expected").get_json()["data"]; assert exp["expected"] > 0
    # wrong count without reason -> 422
    r = cash.post("/cash/closings", {"denominations": {"500": 1}}); assert r.status_code == 422
    notes = {"500": int(exp["expected"] // 500), "100": int((exp["expected"] % 500) // 100)}
    rest = exp["expected"] - notes["500"] * 500 - notes["100"] * 100
    r = cash.post("/cash/closings", {"denominations": notes, "reason": "short by small change, will adjust tomorrow" if rest else None})
    assert r.status_code == 201, r.get_json(); body = r.get_json()["data"]
    assert body["handover"] is not None and body["handover"]["auto"] is True and body["handover"]["state"] == "Submitted"
    assert cash.post("/cash/closings", {"denominations": notes, "reason": "again"}).status_code == 409
    hid = body["handover"]["id"]
    # cashier cannot accept own handover (and lacks Verify)
    assert cash.post(f"/cash/handovers/{hid}/transition", {"to": "Accepted"}).status_code == 403
    r = acc.post(f"/cash/handovers/{hid}/transition", {"to": "Accepted"}); assert r.status_code == 200 and r.get_json()["data"]["state"] == "Accepted"
    assert acc.post(f"/cash/handovers/{hid}/transition", {"to": "Deposited"}).status_code == 422  # ref needed
    r = acc.post(f"/cash/handovers/{hid}/transition", {"to": "Deposited", "deposit_ref": "HDFC-DEP-991"}); assert r.get_json()["data"]["state"] == "Deposited"
    # closing verify by accountant
    cid = body["closing"]["id"]; assert acc.post(f"/cash/closings/{cid}/verify").status_code == 200
    # after closing, same-day receipt is blocked for that cashier
    st = _student(cash); bal = cash.get(f"/fees/students/{st['id']}/balance").get_json()["data"]; d = [x for x in bal["demands"] if x["balance"] > 0][0]
    r = cash.post("/fees/receipts", {"student_id": st["id"], "mode": "Cash", "lines": [{"demand_id": d["id"], "amount": 100}]}); assert r.status_code == 422
    # notifications reached the accountant
    n = acc.get("/notifications").get_json(); assert n["unread"] >= 1


def test_refund_segregation_of_duties(api):
    acc = api("accountant"); cfo = api("cfo"); principal = api("principal"); st = _student(acc)
    r = acc.post("/fees/refunds", {"student_id": st["id"], "amount": 500, "reason": "student withdrew mid-term"}); assert r.status_code == 201; rid = r.get_json()["data"]["id"]
    assert acc.post(f"/fees/refunds/{rid}/transition", {"to": "Approved"}).status_code == 422  # maker
    assert principal.post(f"/fees/refunds/{rid}/transition", {"to": "Approved"}).status_code == 200
    assert principal.post(f"/fees/refunds/{rid}/transition", {"to": "Paid"}).status_code == 422  # approver cannot pay
    assert cfo.post(f"/fees/refunds/{rid}/transition", {"to": "Paid"}).status_code == 200
    assert acc.post("/fees/refunds", {"student_id": st["id"], "amount": 10**7, "reason": "way too much money here"}).status_code == 422


def test_concession_needs_document_and_four_eyes(api):
    acc = api("accountant"); principal = api("principal"); st = _student(acc)
    assert acc.post("/fees/concessions", {"student_id": st["id"], "kind": "Sibling", "amount": 2000}).status_code == 422
    c = acc.post("/fees/concessions", {"student_id": st["id"], "kind": "Sibling", "amount": 2000, "document": "DOC-1"}).get_json()["data"]
    assert acc.post(f"/fees/concessions/{c['id']}/decide", {"approve": True}).status_code == 422
    assert principal.post(f"/fees/concessions/{c['id']}/decide", {"approve": True}).status_code == 200
    bal = acc.get(f"/fees/students/{st['id']}/balance").get_json()["data"]; assert bal["concession"] == 2000
