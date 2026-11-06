"""In-app notifications. Email / SMS / WhatsApp / push adapters plug in here
(see docs/DEVELOPER-GUIDE.md § Integrations); until then every outbound message
is written to email_log with status "Simulated"."""
from app.models import EmailLog, Notification, User
from app.models.base import utcnow


def notify_users(s, user_ids, text: str, *, ref: str | None = None, route: str | None = None, kind: str = "info"):
    n = 0
    for uid in set(filter(None, user_ids)):
        s.add(Notification(user_id=uid, text=text[:500], ref=ref, route=route, kind=kind))
        n += 1
    return n


def notify_roles(s, roles, text: str, *, branch_id: str | None = None, limit_per_role: int = 3, **kw):
    ids = []
    for r in roles:
        q = s.query(User).join(User.role).filter(User.status == "Active").filter(User.role.has(name=r))
        rows = q.all()
        if branch_id:
            scoped = [u for u in rows if u.branch_id == branch_id]
            rows = scoped or rows
        ids.extend(u.id for u in rows[:limit_per_role])
    return notify_users(s, ids, text, **kw)


def queue_email(s, to: str, subject: str, body: str = "", trigger: str = "") -> EmailLog:
    row = EmailLog(to=to, subject=subject[:200], body=body, trigger=trigger, status="Simulated", sent_at=utcnow())
    s.add(row)
    return row
