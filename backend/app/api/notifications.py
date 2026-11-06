from datetime import datetime

from flask import Blueprint, request

from app.api._common import db, ok
from app.core.errors import NotFound
from app.core.security import current_user
from app.core.validation import body
from app.models import Notification

bp = Blueprint("notifications", __name__, url_prefix="/notifications")


@bp.get("")
def mine():
    u = current_user(); s = db(); q = s.query(Notification).filter_by(user_id=u.id)
    if request.args.get("unread") == "1": q = q.filter(Notification.read_at == None)  # noqa: E711
    items = q.order_by(Notification.created_at.desc()).limit(int(request.args.get("limit") or 50)).all()
    return ok([n.to_dict() for n in items], unread=s.query(Notification).filter_by(user_id=u.id).filter(Notification.read_at == None).count())  # noqa: E711


@bp.post("/<nid>/read")
def read(nid):
    u = current_user(); s = db(); n = s.get(Notification, nid)
    if not n or n.user_id != u.id: raise NotFound("Notification not found.")
    n.read_at = n.read_at or datetime.utcnow(); s.commit(); return ok(n.to_dict())


@bp.post("/<nid>/ack")
def ack(nid):
    u = current_user(); s = db(); n = s.get(Notification, nid)
    if not n or n.user_id != u.id: raise NotFound("Notification not found.")
    n.read_at = n.read_at or datetime.utcnow(); n.acknowledged_at = datetime.utcnow(); n.ack_remark = body().get("remark"); s.commit(); return ok(n.to_dict())


@bp.post("/read-all")
def read_all():
    u = current_user(); s = db()
    for n in s.query(Notification).filter_by(user_id=u.id).filter(Notification.read_at == None).all(): n.read_at = datetime.utcnow()  # noqa: E711
    s.commit(); return ok({"ok": True})
