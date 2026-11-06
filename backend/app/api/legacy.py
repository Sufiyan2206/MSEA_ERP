"""API behind the legacy module runtime (see docs/LEGACY-RUNTIME.md).

The browser bundle talks to this through the `db` shim in frontend/src/legacy/bridge.ts:
  GET  /legacy/bootstrap                 all docs + recent collection records (one call at app load)
  GET  /legacy/changes?since=<iso>       docs/records changed since (30 s polling for multi-user freshness)
  PUT  /legacy/docs/<key>                {v, version?}  optimistic concurrency → 409 if version is stale
  POST /legacy/colls/<coll>              add record → {id}
  PUT  /legacy/colls/<coll>/<id>         set record
  PATCH /legacy/colls/<coll>/<id>        merge fields
  GET  /legacy/me                        legacy user id for the signed-in user
Permissions: module "legacy" (View = read, Add = write). Fine-grained per-screen
permissions remain enforced by the legacy role matrix in the browser until the
module is natively ported.
"""
from datetime import datetime

from flask import Blueprint, g, request

from app.api._common import db, ok
from app.core.errors import Conflict, NotFound
from app.core.security import current_user, require
from app.core.validation import body
from app.models import LegacyDoc, LegacyRecord, User
from app.models.base import new_id
from app.services import audit

bp = Blueprint("legacy", __name__, url_prefix="/legacy")
COLLS = ["audit", "approvals", "emaillog", "views", "srfsubs", "ailog"]
LIMITS = {"audit": 600, "approvals": 300, "emaillog": 300, "views": 200, "srfsubs": 500, "ailog": 1500}


def _rec(r: LegacyRecord) -> dict:
    return dict(r.data or {}, id=r.id, ts=(r.data or {}).get("ts") or r.ts.isoformat())


@bp.get("/bootstrap")
@require("legacy", "View")
def bootstrap():
    s = db()
    docs = {d.key: {"v": d.value, "version": d.version} for d in s.query(LegacyDoc).all()}
    colls = {}
    for c in COLLS:
        colls[c] = [_rec(r) for r in s.query(LegacyRecord).filter_by(coll=c).order_by(LegacyRecord.ts.desc()).limit(LIMITS[c]).all()]
    return ok({"docs": docs, "colls": colls, "now": datetime.utcnow().isoformat()})


@bp.get("/changes")
@require("legacy", "View")
def changes():
    s = db()
    try:
        since = datetime.fromisoformat(request.args.get("since", ""))
    except ValueError:
        since = datetime(2000, 1, 1)
    docs = {d.key: {"v": d.value, "version": d.version} for d in s.query(LegacyDoc).filter(LegacyDoc.updated_at > since).all()}
    recs = {}
    for r in s.query(LegacyRecord).filter(LegacyRecord.updated_at > since).all():
        recs.setdefault(r.coll, []).append(_rec(r))
    return ok({"docs": docs, "colls": recs, "now": datetime.utcnow().isoformat()})


@bp.put("/docs/<key>")
@require("legacy", "Add")
def put_doc(key):
    d = body(); s = db()
    if len(key) > 40:
        raise NotFound("Unknown document.")
    row = s.get(LegacyDoc, key)
    if row is None:
        row = LegacyDoc(key=key, value=d.get("v"), version=1, updated_by=g.user.id); s.add(row)
    else:
        if d.get("version") is not None and int(d["version"]) != row.version:
            raise Conflict(f"Document '{key}' was changed by someone else (server version {row.version}); it has been reloaded.", details={"version": row.version, "v": row.value})
        row.value = d.get("v"); row.version += 1; row.updated_by = g.user.id
    audit.record(s, "legacy", "Document updated", entity="legacy_doc", entity_id=key, new={"version": row.version, "bytes": len(str(d.get("v")))})
    s.commit()
    return ok({"key": key, "version": row.version})


@bp.post("/colls/<coll>")
@require("legacy", "Add")
def add_rec(coll):
    if coll not in COLLS:
        raise NotFound("Unknown collection.")
    d = body(); s = db()
    r = LegacyRecord(id=new_id()[:20], coll=coll, data=d, updated_by=g.user.id)
    s.add(r); s.commit()
    return ok({"id": r.id}), 201


@bp.put("/colls/<coll>/<rid>")
@require("legacy", "Add")
def set_rec(coll, rid):
    if coll not in COLLS:
        raise NotFound("Unknown collection.")
    d = body(); s = db(); r = s.get(LegacyRecord, rid)
    if r is None:
        r = LegacyRecord(id=rid[:40], coll=coll, data=d, updated_by=g.user.id); s.add(r)
    else:
        r.data = d; r.updated_by = g.user.id
    s.commit(); return ok({"id": r.id})


@bp.patch("/colls/<coll>/<rid>")
@require("legacy", "Add")
def patch_rec(coll, rid):
    d = body(); s = db(); r = s.get(LegacyRecord, rid)
    if r is None or r.coll != coll:
        raise NotFound("Record not found.")
    r.data = dict(r.data or {}, **d); r.updated_by = g.user.id; s.commit()
    return ok({"id": r.id})


@bp.get("/me")
def me():
    """Resolve the legacy user record for the signed-in user: stored link → email match → role-name match → Super Admin fallback."""
    u = current_user(); s = db()
    doc = s.get(LegacyDoc, "users"); users = (doc.value if doc else None) or []
    pick = None
    if u.legacy_user_id and any(x.get("id") == u.legacy_user_id for x in users):
        pick = u.legacy_user_id
    elif users:
        by_email = next((x for x in users if u.email and x.get("email", "").lower() == u.email.lower()), None)
        by_role = next((x for x in users if x.get("role") == u.role.name and x.get("status") == "Active"), None)
        pick = (by_email or by_role or {}).get("id")
        if pick:
            s.get(User, u.id).legacy_user_id = pick; s.commit()
    return ok({"legacy_user_id": pick, "role": u.role.name, "name": u.name, "email": u.email, "user_id": u.id})


@bp.post("/me")
@require("admin", "Edit")
def set_link():
    """Admin: link a platform user to a legacy user id. {user_id, legacy_user_id}"""
    d = body(); s = db(); u = s.get(User, d.get("user_id"))
    if not u:
        raise NotFound("User not found.")
    u.legacy_user_id = d.get("legacy_user_id") or None
    audit.record(s, "admin", "Legacy user linked", entity="user", entity_id=u.id, new={"legacy_user_id": u.legacy_user_id}); s.commit()
    return ok({"user_id": u.id, "legacy_user_id": u.legacy_user_id})
