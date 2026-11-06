"""Gap Analysis Center: rules, gap action records, history, escalation matrix."""
from datetime import date, datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, ForeignKey, Index, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.base import TimestampMixin

GAP_CATEGORIES = ["Admissions", "Fees & cash", "Finance", "HR & payroll", "Academics", "Maintenance, IT, assets & store", "Compliance & audit"]
GAP_RISKS = ["Low", "Medium", "High", "Critical"]
GAP_STATES = ["Open", "Acknowledged", "In progress", "Resolved", "Rejected"]


class GapRule(Base, TimestampMixin):
    """Configuration of one detector. The detector code lives in services/gap_rules.py
    keyed by `code`; thresholds here override its defaults."""
    __tablename__ = "gap_rules"
    code: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    owner_role: Mapped[str] = mapped_column(String(60), nullable=False)
    reviewer_role: Mapped[str] = mapped_column(String(60), nullable=False)
    risk: Mapped[str] = mapped_column(String(10), nullable=False)
    due_days: Mapped[int] = mapped_column(Integer, default=3)
    action: Mapped[str] = mapped_column(Text, nullable=False)
    thresholds: Mapped[dict | None] = mapped_column(JSON)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class GapRecord(Base, TimestampMixin):
    __tablename__ = "gap_records"
    __table_args__ = (Index("ix_gap_open", "state", "branch_id"), Index("ix_gap_key", "dedupe_key"))
    no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    rule_code: Mapped[str] = mapped_column(String(40), nullable=False)
    dedupe_key: Mapped[str] = mapped_column(String(160), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    branch_id: Mapped[str | None] = mapped_column(ForeignKey("branches.id"))
    impact: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    risk: Mapped[str] = mapped_column(String(10), nullable=False)
    action: Mapped[str] = mapped_column(Text, nullable=False)
    owner_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    reviewer_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    first_seen: Mapped[date] = mapped_column(Date, nullable=False)
    last_seen: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    state: Mapped[str] = mapped_column(String(16), default="Open")
    escalation_level: Mapped[int] = mapped_column(Integer, default=0)  # 0 = none
    reminded_on: Mapped[date | None] = mapped_column(Date)
    evidence: Mapped[str | None] = mapped_column(String(255))
    resolution: Mapped[str | None] = mapped_column(Text)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime)
    closed_by: Mapped[str | None] = mapped_column(String(32))
    history = relationship("GapHistory", cascade="all, delete-orphan", order_by="GapHistory.at.desc()")
    owner = relationship("User", foreign_keys=[owner_id])
    reviewer = relationship("User", foreign_keys=[reviewer_id])


class GapHistory(Base):
    __tablename__ = "gap_history"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    gap_id: Mapped[str] = mapped_column(ForeignKey("gap_records.id", ondelete="CASCADE"), nullable=False, index=True)
    at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    by_name: Mapped[str] = mapped_column(String(120), nullable=False)
    to_state: Mapped[str] = mapped_column(String(16), nullable=False)
    note: Mapped[str | None] = mapped_column(Text)
    file: Mapped[str | None] = mapped_column(String(255))


class EscalationLevel(Base, TimestampMixin):
    """Matrix row: for a category, at `offset_days` from due date notify `roles`
    (keywords `owner` / `reviewer` allowed)."""
    __tablename__ = "escalation_levels"
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    level: Mapped[int] = mapped_column(Integer, nullable=False)
    offset_days: Mapped[int] = mapped_column(Integer, nullable=False)
    label: Mapped[str] = mapped_column(String(80), nullable=False)
    roles: Mapped[list] = mapped_column(JSON, nullable=False)
