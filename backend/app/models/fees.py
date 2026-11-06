"""Fee structure, demand, receipts, concessions, refunds, cashier closing and cash control."""
from datetime import date, datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, ForeignKey, Index, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.base import TimestampMixin

PAYMENT_MODES = ["Cash", "UPI", "Card", "Bank transfer", "Cheque", "Online gateway"]


class FeeHead(Base, TimestampMixin):
    __tablename__ = "fee_heads"
    code: Mapped[str] = mapped_column(String(16), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    gl_code: Mapped[str | None] = mapped_column(String(10))
    refundable: Mapped[bool] = mapped_column(Boolean, default=False)


class FeeStructure(Base, TimestampMixin):
    """Amount per branch / academic year / class / head. Versioned with maker-checker."""
    __tablename__ = "fee_structures"
    __table_args__ = (Index("ix_fs_lookup", "branch_id", "academic_year", "class_name", "status"),)
    branch_id: Mapped[str] = mapped_column(ForeignKey("branches.id"), nullable=False)
    academic_year: Mapped[str] = mapped_column(String(9), nullable=False)
    class_name: Mapped[str] = mapped_column(String(30), nullable=False)
    head_id: Mapped[str] = mapped_column(ForeignKey("fee_heads.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    instalments: Mapped[int] = mapped_column(Integer, default=4)
    version: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(12), default="Draft")  # Draft / Approved / Retired
    approved_by: Mapped[str | None] = mapped_column(String(32))
    head = relationship("FeeHead")


class FeeDemand(Base, TimestampMixin):
    """One row per student / head / instalment. Generated automatically from the
    approved structure less category concession (services.fees.generate_demand)."""
    __tablename__ = "fee_demands"
    __table_args__ = (UniqueConstraint("student_id", "academic_year", "head_id", "instalment_no", name="uq_demand"),)
    student_id: Mapped[str] = mapped_column(ForeignKey("students.id"), nullable=False, index=True)
    academic_year: Mapped[str] = mapped_column(String(9), nullable=False)
    head_id: Mapped[str] = mapped_column(ForeignKey("fee_heads.id"), nullable=False)
    instalment_no: Mapped[int] = mapped_column(Integer, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    concession: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    paid: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    head = relationship("FeeHead")


class Receipt(Base, TimestampMixin):
    __tablename__ = "receipts"
    __table_args__ = (Index("ix_receipt_branch_day", "branch_id", "receipt_date"),)
    no: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    branch_id: Mapped[str] = mapped_column(ForeignKey("branches.id"), nullable=False)
    student_id: Mapped[str] = mapped_column(ForeignKey("students.id"), nullable=False, index=True)
    receipt_date: Mapped[date] = mapped_column(Date, nullable=False)
    total: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    mode: Mapped[str] = mapped_column(String(20), nullable=False)
    reference: Mapped[str | None] = mapped_column(String(80))  # UPI ref / cheque no / txn id
    cashier_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(12), default="Issued")  # Issued / Cancelled
    cancel_reason: Mapped[str | None] = mapped_column(Text)
    cancelled_by: Mapped[str | None] = mapped_column(String(32))
    signature: Mapped[str | None] = mapped_column(String(64))  # HMAC for the QR on the printed receipt
    lines = relationship("ReceiptLine", cascade="all, delete-orphan", back_populates="receipt")
    student = relationship("Student")


class ReceiptLine(Base):
    __tablename__ = "receipt_lines"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    receipt_id: Mapped[str] = mapped_column(ForeignKey("receipts.id", ondelete="CASCADE"), nullable=False, index=True)
    demand_id: Mapped[str | None] = mapped_column(ForeignKey("fee_demands.id"))
    head_name: Mapped[str] = mapped_column(String(80), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    receipt = relationship("Receipt", back_populates="lines")


class Concession(Base, TimestampMixin):
    __tablename__ = "concessions"
    student_id: Mapped[str] = mapped_column(ForeignKey("students.id"), nullable=False, index=True)
    academic_year: Mapped[str] = mapped_column(String(9), nullable=False)
    kind: Mapped[str] = mapped_column(String(40), nullable=False)  # Sibling / Staff ward / Merit / Hardship / Management
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    document: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(12), default="Pending")  # Pending / Approved / Rejected / Revoked
    reason: Mapped[str | None] = mapped_column(Text)
    decided_by: Mapped[str | None] = mapped_column(String(32))


class Refund(Base, TimestampMixin):
    __tablename__ = "refunds"
    no: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    student_id: Mapped[str] = mapped_column(ForeignKey("students.id"), nullable=False, index=True)
    receipt_id: Mapped[str | None] = mapped_column(ForeignKey("receipts.id"))
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(12), default="Requested")  # Requested / Approved / Paid / Rejected
    requested_by: Mapped[str] = mapped_column(String(32), nullable=False)
    approved_by: Mapped[str | None] = mapped_column(String(32))
    paid_by: Mapped[str | None] = mapped_column(String(32))
    paid_on: Mapped[date | None] = mapped_column(Date)


class CashierClosing(Base, TimestampMixin):
    """End-of-day closing per cashier per branch. Expected cash is computed from
    receipts; counted cash comes from the denomination grid."""
    __tablename__ = "cashier_closings"
    __table_args__ = (UniqueConstraint("branch_id", "closing_date", "cashier_id", name="uq_closing"),)
    branch_id: Mapped[str] = mapped_column(ForeignKey("branches.id"), nullable=False, index=True)
    closing_date: Mapped[date] = mapped_column(Date, nullable=False)
    cashier_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    expected: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    counted: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    difference: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    denominations: Mapped[dict | None] = mapped_column(JSON)
    reason: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(12), default="Closed")  # Closed / Verified
    verified_by: Mapped[str | None] = mapped_column(String(32))


class CashHandover(Base, TimestampMixin):
    """Cashier -> Collection Executive -> Head Cashier -> Bank deposit."""
    __tablename__ = "cash_handovers"
    no: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    branch_id: Mapped[str] = mapped_column(ForeignKey("branches.id"), nullable=False, index=True)
    handover_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    from_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    denominations: Mapped[dict | None] = mapped_column(JSON)
    state: Mapped[str] = mapped_column(String(20), default="Submitted")  # Submitted / Accepted / Deposited / Rejected
    accepted_by: Mapped[str | None] = mapped_column(String(32))
    accepted_amount: Mapped[float | None] = mapped_column(Numeric(12, 2))
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime)
    deposit_ref: Mapped[str | None] = mapped_column(String(80))
    deposited_at: Mapped[datetime | None] = mapped_column(DateTime)
    note: Mapped[str | None] = mapped_column(Text)
    auto: Mapped[bool] = mapped_column(Boolean, default=False)
