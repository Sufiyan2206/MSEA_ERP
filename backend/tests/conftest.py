"""Test fixtures: in-memory SQLite, tables from models, seeded roles + minimal org.
Run: cd backend && pytest -q"""
import os
import sys
from datetime import date

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app import create_app  # noqa: E402
from app.core.config import TestConfig  # noqa: E402
from app.core.db import Base, SessionLocal, engine  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.models import Branch, FeeHead, FeeStructure, Role, RolePermission, Section, Student, User  # noqa: E402
from app.services.gap_engine import seed_rules  # noqa: E402
from scripts.seed import ROLES  # noqa: E402


@pytest.fixture(scope="session")
def app():
    a = create_app(TestConfig)
    from app.core import db as dbmod
    Base.metadata.create_all(dbmod.engine)
    with a.app_context():
        s = SessionLocal()
        roles = {}
        for name, perms in ROLES.items():
            r = Role(name=name, system=True); s.add(r); s.flush(); roles[name] = r
            for m, acts in perms.items():
                for ac in acts: s.add(RolePermission(role_id=r.id, module=m, action=ac))
        seed_rules(s)
        b1 = Branch(code="HYD", name="Hyderabad", capacity=100, active=True); b2 = Branch(code="BLR", name="Bengaluru", capacity=100, active=True); s.add_all([b1, b2]); s.flush()
        def mk(u, role, b=None, **kw):
            x = User(username=u, name=u.title(), role_id=roles[role].id, branch_id=b.id if b else None, password_hash=hash_password("Msea@12345"), must_change_password=False, **kw); s.add(x); return x
        mk("superadmin", "Super Admin"); mk("cfo", "CFO"); mk("principal", "Principal", b1); mk("accountant", "Branch Accountant", b1); mk("cashier", "Fee Collector", b1)
        mk("cashier2", "Fee Collector", b1); mk("counsellor", "Admission Counsellor", b1); mk("teacher", "Class Teacher", b1); mk("hr", "HR Manager"); mk("blr_principal", "Principal", b2); mk("parent", "Parent", b1)
        h = FeeHead(code="TUI", name="Tuition fee", refundable=True); s.add(h); s.flush()
        for cls in ("Class 1", "Class 2"):
            s.add(FeeStructure(branch_id=b1.id, academic_year="2026-27", class_name=cls, head_id=h.id, amount=40000, instalments=4, version=1, status="Approved"))
            s.add(Section(branch_id=b1.id, class_name=cls, name="A", capacity=2))
        s.add(Student(admission_no="HYD-0001", name="Aarav Khan", branch_id=b1.id, academic_year="2026-27", class_name="Class 1", section="A", status="Active", join_date=date(2026, 6, 1)))
        s.commit(); SessionLocal.remove()
    yield a


@pytest.fixture()
def client(app):
    return app.test_client()


class Api:
    def __init__(self, client, username):
        self.c = client
        r = client.post("/api/v1/auth/login", json={"username": username, "password": "Msea@12345"})
        assert r.status_code == 200, r.get_json()
        self.token = r.get_json()["data"]["token"]; self.me = r.get_json()["data"]["user"]

    def _h(self): return {"Authorization": f"Bearer {self.token}"}
    def get(self, p, **kw): return self.c.get("/api/v1" + p, headers=self._h(), **kw)
    def post(self, p, json=None, **kw): return self.c.post("/api/v1" + p, json=json or {}, headers=self._h(), **kw)
    def patch(self, p, json=None): return self.c.patch("/api/v1" + p, json=json or {}, headers=self._h())
    def put(self, p, json=None): return self.c.put("/api/v1" + p, json=json or {}, headers=self._h())


@pytest.fixture()
def api(client):
    return lambda u: Api(client, u)
