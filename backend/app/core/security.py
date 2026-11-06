"""Authentication (JWT), authorisation (role → module/action) and branch scope.

Usage in a blueprint:
    @bp.get("/receipts")
    @require("fees", "View")
    def list_receipts(): ...
`g.user` is the User, `g.scope` the set of branch ids the user may see
(None means every branch).
"""
import functools
from datetime import date, datetime, timezone

import jwt
from flask import current_app, g, request
from werkzeug.security import check_password_hash, generate_password_hash

from app.core.db import SessionLocal
from app.core.errors import Forbidden, Unauthorized
from app.models import AccessMapping, Branch, RolePermission, User

MANAGEMENT_ROLES = {"Super Admin", "CEO", "CFO", "COO", "HR Manager", "Finance Manager", "Internal Auditor", "System Admin"}


def hash_password(p: str) -> str:
    return generate_password_hash(p)


def verify_password(h: str, p: str) -> bool:
    return check_password_hash(h, p)


def issue_token(user: User) -> str:
    cfg = current_app.config
    now = datetime.now(timezone.utc)
    payload = {"sub": user.id, "role": user.role.name, "name": user.name, "iat": now, "exp": now + cfg["JWT_EXPIRES"]}
    return jwt.encode(payload, cfg["JWT_SECRET"], algorithm="HS256")


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, current_app.config["JWT_SECRET"], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise Unauthorized("Session expired; sign in again.")
    except jwt.InvalidTokenError:
        raise Unauthorized("Invalid token.")


def current_user() -> User:
    if getattr(g, "user", None):
        return g.user
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise Unauthorized("Sign in required.")
    payload = decode_token(auth[7:])
    s = SessionLocal()
    user = s.get(User, payload["sub"])
    if not user or user.status != "Active":
        raise Unauthorized("Account is not active.")
    g.user = user
    g.scope = compute_scope(s, user)
    g.perms = {(p.module, p.action) for p in s.query(RolePermission).filter_by(role_id=user.role_id).all()}
    return user


def compute_scope(s, user: User) -> set[str] | None:
    """Branch ids visible to the user, or None for all."""
    if user.role.name in MANAGEMENT_ROLES:
        return None
    today = date.today()
    maps = s.query(AccessMapping).filter(AccessMapping.user_id == user.id, AccessMapping.status == "Active").all()
    ids: set[str] = set()
    for m in maps:
        if m.valid_from > today or (m.valid_to and m.valid_to < today):
            continue
        if m.scope_type == "All Branches":
            return None
        if m.scope_type == "Selected Branches":
            ids.update(m.branch_ids or [])
        else:
            col = {"All Branches Under Zone": Branch.zone, "All Branches Under Region": Branch.region, "All Branches Under State": Branch.state}.get(m.scope_type)
            if col is not None:
                ids.update(b.id for b in s.query(Branch.id).filter(col == m.scope_value).all())
            elif m.scope_type == "All Branches Under Entity":
                ids.update(b.id for b in s.query(Branch.id).filter(Branch.entity_id == m.scope_value).all())
    if user.branch_id:
        ids.add(user.branch_id)
    if not ids and not maps and user.branch_id is None:
        # head-office user without any branch or mapping: organisation-wide read scope
        return None
    return ids


def can(module: str, action: str = "View") -> bool:
    current_user()
    if g.user.role.name == "Super Admin":
        return True
    return (module, action) in g.perms


def require(module: str, action: str = "View"):
    def deco(fn):
        @functools.wraps(fn)
        def wrapper(*a, **kw):
            current_user()
            if not can(module, action):
                raise Forbidden(f"You need '{action}' on '{module}'.")
            return fn(*a, **kw)
        return wrapper
    return deco


def in_scope(branch_id: str | None) -> bool:
    current_user()
    return branch_id is None or g.scope is None or branch_id in g.scope


def assert_scope(branch_id: str | None):
    if not in_scope(branch_id):
        raise Forbidden("That branch is outside your access scope.")


def scope_filter(query, column):
    """Apply the branch scope to a query column (e.g. Receipt.branch_id)."""
    current_user()
    if g.scope is None:
        return query
    return query.filter(column.in_(list(g.scope)))
