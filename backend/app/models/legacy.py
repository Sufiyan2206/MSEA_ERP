"""Storage for the legacy module runtime (strangler pattern).

The original single-file app keeps its state as ~99 whole JSON documents
(`Store.get/put`) plus 6 append-only collections (audit, approvals, emaillog,
views, srfsubs, ailog). Until a module is natively ported, its data lives here:
one row per document and one row per collection record, in MySQL, versioned
and audited. Natively ported modules use their own tables instead.
"""
from datetime import datetime

from sqlalchemy import JSON, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.base import utcnow


class LegacyDoc(Base):
    __tablename__ = "legacy_docs"
    key: Mapped[str] = mapped_column(String(40), primary_key=True)
    value: Mapped[dict | list | None] = mapped_column(JSON)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)
    updated_by: Mapped[str | None] = mapped_column(String(32))


class LegacyRecord(Base):
    __tablename__ = "legacy_records"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    coll: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    ts: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False, index=True)
    data: Mapped[dict | None] = mapped_column(JSON)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)
    updated_by: Mapped[str | None] = mapped_column(String(32))
