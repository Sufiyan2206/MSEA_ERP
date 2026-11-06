"""Employees, leave, payroll."""
from datetime import date

from sqlalchemy import JSON, Boolean, Date, ForeignKey, Index, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.base import TimestampMixin


class Employee(Base, TimestampMixin):
    __tablename__ = "employees"
    emp_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    branch_id: Mapped[str | None] = mapped_column(ForeignKey("branches.id"), index=True)
    department: Mapped[str | None] = mapped_column(String(60))
    designation: Mapped[str | None] = mapped_column(String(80))
    category: Mapped[str] = mapped_column(String(20), default="Teaching")  # Teaching / Non-teaching / Admin / Support
    doj: Mapped[date] = mapped_column(Date, nullable=False)
    dol: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(20), default="Active")
    ctc: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    pan: Mapped[str | None] = mapped_column(String(16))
    aadhaar_last4: Mapped[str | None] = mapped_column(String(4))
    uan: Mapped[str | None] = mapped_column(String(16))
    esi_no: Mapped[str | None] = mapped_column(String(20))
    bank_account: Mapped[str | None] = mapped_column(String(30))
    bank_ifsc: Mapped[str | None] = mapped_column(String(15))
    mobile: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(120))
    user_id: Mapped[str | None] = mapped_column(String(32))
    extra: Mapped[dict | None] = mapped_column(JSON)
    branch = relationship("Branch")


class LeaveRequest(Base, TimestampMixin):
    __tablename__ = "leave_requests"
    employee_id: Mapped[str] = mapped_column(ForeignKey("employees.id"), nullable=False, index=True)
    kind: Mapped[str] = mapped_column(String(20), nullable=False)  # CL / SL / EL / LOP
    from_date: Mapped[date] = mapped_column(Date, nullable=False)
    to_date: Mapped[date] = mapped_column(Date, nullable=False)
    days: Mapped[float] = mapped_column(Numeric(4, 1), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(12), default="Pending")
    decided_by: Mapped[str | None] = mapped_column(String(32))
    decision_note: Mapped[str | None] = mapped_column(String(300))


class PayrollRun(Base, TimestampMixin):
    __tablename__ = "payroll_runs"
    __table_args__ = (UniqueConstraint("ym", "branch_id", name="uq_payroll_run"),)
    ym: Mapped[str] = mapped_column(String(7), nullable=False, index=True)  # 2026-10
    branch_id: Mapped[str | None] = mapped_column(ForeignKey("branches.id"))  # null = all branches
    status: Mapped[str] = mapped_column(String(20), default="Draft")  # Draft / Finance verified / CFO approved / Bank file generated / Paid
    totals: Mapped[dict | None] = mapped_column(JSON)
    verified_by: Mapped[str | None] = mapped_column(String(32))
    approved_by: Mapped[str | None] = mapped_column(String(32))
    bank_file_name: Mapped[str | None] = mapped_column(String(120))
    lines = relationship("PayrollLine", cascade="all, delete-orphan", back_populates="run")


class PayrollLine(Base):
    __tablename__ = "payroll_lines"
    __table_args__ = (UniqueConstraint("run_id", "employee_id", name="uq_payroll_line"),)
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    run_id: Mapped[str] = mapped_column(ForeignKey("payroll_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id: Mapped[str] = mapped_column(ForeignKey("employees.id"), nullable=False)
    days_paid: Mapped[float] = mapped_column(Numeric(4, 1), nullable=False)
    gross: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    pf: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    esi: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    pt: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    tds: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    other_deductions: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    net: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    variance_flag: Mapped[str | None] = mapped_column(String(120))  # vs CTC / prior month
    excluded: Mapped[bool] = mapped_column(Boolean, default=False)
    run = relationship("PayrollRun", back_populates="lines")
