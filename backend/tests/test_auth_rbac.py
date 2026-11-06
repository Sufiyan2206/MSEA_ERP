def test_health(client):
    r = client.get("/health"); assert r.status_code == 200 and r.get_json()["db"] == "ok"


def test_login_wrong_password(client):
    r = client.post("/api/v1/auth/login", json={"username": "cashier", "password": "nope"})
    assert r.status_code == 401 and r.get_json()["error"]["code"] == "unauthorized"


def test_me_and_permissions(api):
    a = api("cashier"); r = a.get("/auth/me"); d = r.get_json()["data"]
    assert d["role"] == "Fee Collector" and "Add" in d["permissions"]["fees"] and d["scope"] is not None


def test_rbac_forbidden(api):
    a = api("teacher"); r = a.get("/fees/receipts"); assert r.status_code == 403
    r = a.post("/hr/payroll", {"ym": "2026-10"}); assert r.status_code == 403


def test_missing_token(client):
    assert client.get("/api/v1/students").status_code == 401


def test_branch_scope_enforced(api):
    hyd = api("principal"); blr = api("blr_principal")
    sid = hyd.get("/students").get_json()["data"][0]["id"]
    assert blr.get(f"/students/{sid}").status_code == 403
    assert all(s["branch"] == "Bengaluru" for s in blr.get("/students").get_json()["data"])


def test_role_permission_change_needs_reason(api):
    sa = api("superadmin"); roles = sa.get("/roles").get_json()["data"]; rid = [r for r in roles if r["name"] == "Parent"][0]["id"]
    assert sa.put(f"/roles/{rid}/permissions", {"permissions": {"students": ["View"]}}).status_code == 400
    assert sa.put(f"/roles/{rid}/permissions", {"permissions": {"students": ["View"]}, "reason": "parents see own kids"}).status_code == 200
    log = sa.get("/audit?module=admin").get_json()["data"]; assert any(x["action"] == "Role permissions changed" for x in log)
