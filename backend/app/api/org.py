"""Branches, sections, academic years, users, roles, access mappings, audit."""
from flask import Blueprint, g, request

from app.api._common import db, ok, rows
from app.core.errors import ApiError, NotFound
from app.core.security import can, current_user, hash_password, require, scope_filter
from app.core.validation import as_date, body, need, page_args
from app.models import ACTIONS, AccessMapping, AuditLog, Branch, Role, RolePermission, Section, User
from app.services import audit

bp = Blueprint("org", __name__)


@bp.get("/branches")
def branches():
    current_user(); s = db()
    q = scope_filter(s.query(Branch).filter(Branch.active == True), Branch.id)  # noqa: E712
    return rows(q.order_by(Branch.name).all())


@bp.post("/branches")
@require("admin", "Add")
def add_branch():
    d = body(); need(d, "code", "name"); s = db()
    if s.query(Branch).filter_by(code=d["code"]).first():
        raise ApiError("Branch code already exists.")
    b = Branch(code=d["code"], name=d["name"], region=d.get("region"), zone=d.get("zone"), state=d.get("state"), city=d.get("city"), kind=d.get("kind", "School"), capacity=int(d.get("capacity") or 0), created_by=g.user.id)
    s.add(b); audit.record(s, "admin", "Branch added", entity="branch", entity_id=b.id, new=d); s.commit()
    return ok(b.to_dict()), 201


@bp.get("/sections")
def sections():
    current_user(); s = db()
    q = scope_filter(s.query(Section), Section.branch_id)
    if request.args.get("branch_id"):
        q = q.filter(Section.branch_id == request.args["branch_id"])
    return rows(q.order_by(Section.class_name, Section.name).all())


@bp.post("/sections")
@require("admin", "Add")
def add_section():
    d = body(); need(d, "branch_id", "class_name", "name"); s = db()
    sec = Section(branch_id=d["branch_id"], class_name=d["class_name"], name=d["name"].upper(), capacity=int(d.get("capacity") or 40), created_by=g.user.id)
    s.add(sec); audit.record(s, "admin", "Section added", entity="section", entity_id=sec.id, branch_id=sec.branch_id, new=d); s.commit()
    return ok(sec.to_dict()), 201


@bp.get("/roles")
@require("admin", "View")
def roles():
    s = db(); out = []
    for r in s.query(Role).order_by(Role.name).all():
        perms = {}
        for p in r.permissions:
            perms.setdefault(p.module, []).append(p.action)
        out.append({"id": r.id, "name": r.name, "system": r.system, "permissions": perms})
    return ok(out)


@bp.put("/roles/<rid>/permissions")
@require("admin", "Configure Settings")
def set_permissions(rid):
    d = body(); perms = d.get("permissions") or {}; reason = (d.get("reason") or "").strip()
    if len(reason) < 5:
        raise ApiError("Give a reason (at least 5 characters).")
    s = db(); r = s.get(Role, rid)
    if not r:
        raise NotFound("Role not found.")
    old = {p.module: [] for p in r.permissions}
    for p in r.permissions:
        old[p.module].append(p.action)
    s.query(RolePermission).filter_by(role_id=rid).delete()
    for module, actions in perms.items():
        for a in actions:
            if a not in ACTIONS:
                raise ApiError(f"Unknown action {a}.")
            s.add(RolePermission(role_id=rid, module=module, action=a))
    audit.record(s, "admin", "Role permissions changed", entity="role", entity_id=rid, old=old, new=perms, reason=reason)
    s.commit()
    return ok({"saved": True})


@bp.get("/users")
@require("admin", "View")
def users():
    s = db(); limit, offset = page_args()
    q = s.query(User)
    if request.args.get("q"):
        like = f"%{request.args['q']}%"
        q = q.filter((User.name.ilike(like)) | (User.username.ilike(like)))
    total = q.count()
    out = [dict(u.to_dict(exclude={"password_hash"}), role=u.role.name) for u in q.order_by(User.name).offset(offset).limit(limit).all()]
    return ok(out, total=total)


@bp.post("/users")
@require("admin", "Add")
def add_user():
    d = body(); need(d, "username", "name", "role_id", "password"); s = db()
    uname = d["username"].strip().lower()
    if s.query(User).filter_by(username=uname).first():
        raise ApiError("Username already exists.")
    if not s.get(Role, d["role_id"]):
        raise ApiError("Unknown role.")
    u = User(username=uname, name=d["name"], email=d.get("email"), mobile=d.get("mobile"), role_id=d["role_id"], branch_id=d.get("branch_id"), password_hash=hash_password(d["password"]), created_by=g.user.id, kids=d.get("kids"))
    s.add(u)
    if d.get("scope_type"):
        s.add(AccessMapping(user_id=u.id, scope_type=d["scope_type"], scope_value=d.get("scope_value"), branch_ids=d.get("branch_ids"), valid_from=as_date(d.get("valid_from") or "2000-01-01", "valid_from"), level=d.get("level", "Read Only"), created_by=g.user.id))
    audit.record(s, "admin", "User added", entity="user", entity_id=u.id, new={k: v for k, v in d.items() if k != "password"})
    s.commit()
    return ok(dict(u.to_dict(exclude={"password_hash"}), role=u.role.name)), 201


@bp.patch("/users/<uid>")
@require("admin", "Edit")
def edit_user(uid):
    d = body(); s = db(); u = s.get(User, uid)
    if not u:
        raise NotFound("User not found.")
    old = u.to_dict(exclude={"password_hash"})
    for k in ("name", "email", "mobile", "branch_id", "status", "role_id", "kids"):
        if k in d:
            setattr(u, k, d[k])
    if d.get("password"):
        u.password_hash = hash_password(d["password"]); u.must_change_password = True
    audit.record(s, "admin", "User edited", entity="user", entity_id=uid, old=old, new={k: v for k, v in d.items() if k != "password"}, reason=d.get("reason"))
    s.commit()
    return ok(dict(u.to_dict(exclude={"password_hash"}), role=u.role.name))


@bp.get("/users/<uid>/mappings")
@require("admin", "View")
def mappings(uid):
    s = db(); return rows(s.query(AccessMapping).filter_by(user_id=uid).all())


@bp.post("/users/<uid>/mappings")
@require("admin", "Edit")
def add_mapping(uid):
    d = body(); need(d, "scope_type", "valid_from"); s = db()
    if not s.get(User, uid):
        raise NotFound("User not found.")
    m = AccessMapping(user_id=uid, scope_type=d["scope_type"], scope_value=d.get("scope_value"), branch_ids=d.get("branch_ids"), valid_from=as_date(d["valid_from"], "valid_from"), valid_to=as_date(d["valid_to"], "valid_to") if d.get("valid_to") else None, level=d.get("level", "Read Only"), created_by=g.user.id)
    s.add(m); audit.record(s, "admin", "Access mapping added", entity="user", entity_id=uid, new=d); s.commit()
    return ok(m.to_dict()), 201


@bp.get("/audit")
@require("audit", "View")
def audit_log():
    s = db(); limit, offset = page_args(100, 1000)
    q = s.query(AuditLog)
    for k in ("module", "user_id", "entity_id", "branch_id"):
        if request.args.get(k):
            q = q.filter(getattr(AuditLog, k) == request.args[k])
    if request.args.get("from"):
        q = q.filter(AuditLog.ts >= as_date(request.args["from"], "from"))
    total = q.count()
    out = []
    for a in q.order_by(AuditLog.ts.desc()).offset(offset).limit(limit).all():
        out.append({c.name: (getattr(a, c.name).isoformat() if c.name == "ts" else getattr(a, c.name)) for c in AuditLog.__table__.columns})
    return ok(out, total=total)
