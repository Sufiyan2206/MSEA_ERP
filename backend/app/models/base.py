"""Shared model helpers."""
import uuid
from decimal import Decimal
from datetime import datetime, timezone

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column


def new_id() -> str:
    """Primary keys are 32-char UUID hex strings: safe to generate offline on the
    PWA and merge later without collisions."""
    return uuid.uuid4().hex


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class TimestampMixin:
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)
    created_by: Mapped[str | None] = mapped_column(String(32), nullable=True)

    def to_dict(self, exclude: set[str] | None = None) -> dict:
        exclude = exclude or set()
        out = {}
        for c in self.__table__.columns:  # type: ignore[attr-defined]
            if c.name in exclude:
                continue
            v = getattr(self, c.name)
            if isinstance(v, Decimal):
                v = float(v)
            elif isinstance(v, datetime):
                v = v.isoformat()
            elif hasattr(v, "isoformat"):
                v = v.isoformat()
            out[c.name] = v
        return out
