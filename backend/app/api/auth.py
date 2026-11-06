from datetime import datetime

from flask import Blueprint, g, request

from app.api._common import db, ok
from app.core.errors import ApiError, Unauthorized
from app.core.security import current_user, hash_password, issue_token, verify_password
from app.core.validation import body, need
from app.models import User
from app.services import audit

bp = Blueprint("auth", __name__, url_prefix="/auth")


@bp.post("/login")
def login():
    data = body(); need(data, "username", "password")
    s = db()
    user = s.query(User).filter(User.username == data["username"].strip().lower()).first()
    if not user or not verify_password(user.password_hash, data["password"]):
        if user:
            user.failed_logins += 1
            if user.failed_logins >= 5:
                user.status = "Locked"
            s.commit()
        raise Unauthorized("Wrong username or password.")
    if user.status != "Active":
        raise Unauthorized("Account locked or inactive; contact the System Admin.")
    user.failed_logins = 0
    user.last_login_at = datetime.utcnow()
    g.user = user
    audit.record(s, "Session", "Signed in", entity="user", entity_id=user.id)
    s.commit()
    return ok({"token": issue_token(user), "user": me_payload(user)})


def me_payload(user: User) -> dict:
    from app.core.security import compute_scope
    from app.models import RolePermission
    s = db()
    perms = {}
    for p in s.query(RolePermission).filter_by(role_id=user.role_id).all():
        perms.setdefault(p.module, []).append(p.action)
    scope = compute_scope(s, user)
    return {"id": user.id, "username": user.username, "name": user.name, "role": user.role.name, "branch_id": user.branch_id,
            "must_change_password": user.must_change_password, "permissions": perms, "scope": None if scope is None else sorted(scope), "kids": user.kids or []}


@bp.get("/me")
def me():
    return ok(me_payload(current_user()))


@bp.post("/change-password")
def change_password():
    user = current_user(); data = body(); need(data, "old_password", "new_password")
    if not verify_password(user.password_hash, data["old_password"]):
        raise ApiError("Current password is wrong.")
    if len(data["new_password"]) < 8:
        raise ApiError("New password must be at least 8 characters.")
    s = db(); u = s.get(User, user.id)
    u.password_hash = hash_password(data["new_password"]); u.must_change_password = False
    audit.record(s, "Session", "Password changed", entity="user", entity_id=u.id)
    s.commit()
    return ok({"changed": True})


@bp.post("/logout")
def logout():
    user = current_user(); s = db()
    audit.record(s, "Session", "Signed out", entity="user", entity_id=user.id); s.commit()
    return ok({"bye": True})
