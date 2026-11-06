"""Student information system and admissions CRM."""
from datetime import date, datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.base import TimestampMixin


class Student(Base, TimestampMixin):
    __tablename__ = "students"
    __table_args__ = (Index("ix_student_branch_class", "branch_id", "class_name", "section"),)
    admission_no: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    branch_id: Mapped[str] = mapped_column(ForeignKey("branches.id"), nullable=False)
    academic_year: Mapped[str] = mapped_column(String(9), nullable=False)
    class_name: Mapped[str] = mapped_column(String(30), nullable=False)
    section: Mapped[str | None] = mapped_column(String(8))
    gender: Mapped[str | None] = mapped_column(String(10))
    dob: Mapped[date | None] = mapped_column(Date)
    parent_name: Mapped[str | None] = mapped_column(String(120))
    mobile: Mapped[str | None] = mapped_column(String(20), index=True)
    email: Mapped[str | None] = mapped_column(String(120))
    address: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(30), default="General")  # fee category: General / Little Hearts / Sponsored ...
    status: Mapped[str] = mapped_column(String(20), default="Active")  # Active / Cancelled / Withdrawn / TC Issued / Transferred
    join_date: Mapped[date] = mapped_column(Date, nullable=False)
    exit_date: Mapped[date | None] = mapped_column(Date)
    source: Mapped[str | None] = mapped_column(String(40))
    photo_url: Mapped[str | None] = mapped_column(String(255))
    lead_id: Mapped[str | None] = mapped_column(String(32))
    extra: Mapped[dict | None] = mapped_column(JSON)  # documents, transport, hostel flags …
    branch = relationship("Branch")


LEAD_STAGES = ["New", "Contacted", "Visited", "Application", "Documents", "SRF Paid", "Admitted", "Lost"]


class Lead(Base, TimestampMixin):
    __tablename__ = "leads"
    no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    branch_id: Mapped[str] = mapped_column(ForeignKey("branches.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    class_name: Mapped[str] = mapped_column(String(30), nullable=False)
    parent_name: Mapped[str | None] = mapped_column(String(120))
    mobile: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    email: Mapped[str | None] = mapped_column(String(120))
    source: Mapped[str] = mapped_column(String(40), default="Walk-in")
    stage: Mapped[str] = mapped_column(String(20), default="New", index=True)
    counsellor_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    next_follow_up: Mapped[date | None] = mapped_column(Date, index=True)
    srf_paid: Mapped[bool] = mapped_column(Boolean, default=False)
    srf_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    admission_no: Mapped[str | None] = mapped_column(String(30))
    student_id: Mapped[str | None] = mapped_column(String(32))
    lost_reason: Mapped[str | None] = mapped_column(String(200))
    branch = relationship("Branch")
    counsellor = relationship("User")


class LeadEvent(Base):
    __tablename__ = "lead_events"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    lead_id: Mapped[str] = mapped_column(ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    kind: Mapped[str] = mapped_column(String(30), nullable=False)  # stage / call / visit / message / note
    text: Mapped[str] = mapped_column(String(500), nullable=False)
    by_name: Mapped[str | None] = mapped_column(String(120))
