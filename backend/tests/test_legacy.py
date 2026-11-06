def test_legacy_docs_and_records(api):
    sa = api("superadmin"); t = api("teacher"); p = api("parent")
    assert p.get("/legacy/bootstrap").status_code == 403
    b = t.get("/legacy/bootstrap").get_json()["data"]; assert "docs" in b and "colls" in b
    r = sa.put("/legacy/docs/config", {"v": {"ay": "2026-27"}}); assert r.status_code == 200 and r.get_json()["data"]["version"] == 1
    r = sa.put("/legacy/docs/config", {"v": {"ay": "2027-28"}, "version": 1}); assert r.get_json()["data"]["version"] == 2
    r = sa.put("/legacy/docs/config", {"v": {"ay": "x"}, "version": 1}); assert r.status_code == 409 and r.get_json()["error"]["details"]["version"] == 2
    rid = sa.post("/legacy/colls/audit", {"module": "x", "action": "y"}).get_json()["data"]["id"]
    assert sa.patch(f"/legacy/colls/audit/{rid}", {"status": "Done"}).status_code == 200
    assert sa.post("/legacy/colls/nope", {}).status_code == 404
    ch = sa.get("/legacy/changes?since=2000-01-01T00:00:00").get_json()["data"]; assert "config" in ch["docs"] and ch["colls"]["audit"][0]["status"] == "Done"
    sa.put("/legacy/docs/users", {"v": [{"id": "U001", "role": "Super Admin", "status": "Active", "email": "x@y"}, {"id": "U002", "role": "Class Teacher", "status": "Active"}]})
    assert sa.get("/legacy/me").get_json()["data"]["legacy_user_id"] == "U001"
    assert t.get("/legacy/me").get_json()["data"]["legacy_user_id"] == "U002"
    assert sa.post("/legacy/me", {"user_id": t.me["id"], "legacy_user_id": "U001"}).status_code == 200
    assert t.get("/legacy/me").get_json()["data"]["legacy_user_id"] == "U001"
