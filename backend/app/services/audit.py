"""Audit trail writer. Call after a successful business change, inside the same
transaction, so the audit row and the change commit together."""
from flask import g, has_request_context, request

from app.models import AuditLog
from app.models.base import utcnow


def record(s, module: str, action: str, *, entity: str | None = None, entity_id: str | None = None,
           branch_id: str | None = None, old: dict | None = None, new: dict | None = None,
           reason: str | None = None, evidence: str | None = None, screen: str | None = None):
    user = getattr(g, "user", None) if has_request_context() else None
    row = AuditLog(
        ts=utcnow(), module=module, action=action, entity=entity, entity_id=entity_id, branch_id=branch_id,
        old=old, new=new, reason=reason, evidence=evidence, screen=screen,
        user_id=user.id if user else None, user_name=user.name if user else "System",
        role=user.role.name if user else "System",
        ip=request.headers.get("X-Forwarded-For", request.remote_addr) if has_request_context() else None,
        device=request.headers.get("User-Agent", "")[:255] if has_request_context() else None,
    )
    s.add(row)
    return row
