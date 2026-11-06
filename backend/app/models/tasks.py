"""Delegation and branch checklists (daily / monthly closing)."""
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.base import TimestampMixin


class Delegation(Base, TimestampMixin):
    __tablename__ = "delegations"
    from_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    to_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    valid_from: Mapped[date] = mapped_column(Date, nullable=False)
    valid_to: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str] = mapped_column(String(200), nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Checklist(Base, TimestampMixin):
    __tablename__ = "checklists"
    __table_args__ = (UniqueConstraint("branch_id", "kind", "period", name="uq_checklist"),)
    branch_id: Mapped[str] = mapped_column(ForeignKey("branches.id"), nullable=False, index=True)
    kind: Mapped[str] = mapped_column(String(12), nullable=False)  # daily / monthly
    period: Mapped[str] = mapped_column(String(10), nullable=False)  # 2026-10-19 or 2026-10
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)
    completed_by: Mapped[str | None] = mapped_column(String(120))
    items = relationship("ChecklistItem", cascade="all, delete-orphan", order_by="ChecklistItem.seq")


class ChecklistItem(Base):
    __tablename__ = "checklist_items"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    checklist_id: Mapped[str] = mapped_column(ForeignKey("checklists.id", ondelete="CASCADE"), nullable=False, index=True)
    seq: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(String(200), nullable=False)
    done: Mapped[bool] = mapped_column(Boolean, default=False)
    done_by: Mapped[str | None] = mapped_column(String(120))
    done_at: Mapped[datetime | None] = mapped_column(DateTime)
    note: Mapped[str | None] = mapped_column(Text)
    evidence: Mapped[str | None] = mapped_column(String(255))
