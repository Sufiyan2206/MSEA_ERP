"""Student (daily and period) and staff attendance."""
from datetime import date, datetime

from sqlalchemy import DateTime, Date, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.base import TimestampMixin

STUDENT_STATUS = {"P": "Present", "A": "Absent", "L": "Late", "V": "Leave", "M": "Medical leave", "E": "Excused"}


class StudentAttendance(Base, TimestampMixin):
    __tablename__ = "student_attendance"
    __table_args__ = (
        UniqueConstraint("student_id", "att_date", "period", name="uq_stu_att"),
        Index("ix_stu_att_section", "branch_id", "class_name", "section", "att_date"),
    )
    student_id: Mapped[str] = mapped_column(ForeignKey("students.id"), nullable=False)
    branch_id: Mapped[str] = mapped_column(ForeignKey("branches.id"), nullable=False)
    class_name: Mapped[str] = mapped_column(String(30), nullable=False)
    section: Mapped[str | None] = mapped_column(String(8))
    att_date: Mapped[date] = mapped_column(Date, nullable=False)
    period: Mapped[int] = mapped_column(Integer, default=0)  # 0 = daily register, 1..n = period-wise
    status: Mapped[str] = mapped_column(String(2), nullable=False)
    marked_by: Mapped[str] = mapped_column(String(32), nullable=False)
    corrected_reason: Mapped[str | None] = mapped_column(String(300))


class StaffAttendance(Base, TimestampMixin):
    __tablename__ = "staff_attendance"
    __table_args__ = (UniqueConstraint("employee_id", "att_date", name="uq_staff_att"),)
    employee_id: Mapped[str] = mapped_column(ForeignKey("employees.id"), nullable=False, index=True)
    branch_id: Mapped[str] = mapped_column(ForeignKey("branches.id"), nullable=False)
    att_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False)  # Present / Absent / Late / Half day / Leave / Weekly off / Holiday / Missed punch
    in_time: Mapped[datetime | None] = mapped_column(DateTime)
    out_time: Mapped[datetime | None] = mapped_column(DateTime)
    source: Mapped[str] = mapped_column(String(20), default="Manual")  # Manual / Biometric / Mobile
    regularised_by: Mapped[str | None] = mapped_column(String(32))
    reason: Mapped[str | None] = mapped_column(String(300))
