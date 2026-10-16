from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class DailyPracticeSession(Base):
    """The single, auditable daily-problem assignment for a user."""

    __tablename__ = "daily_practice_sessions"
    __table_args__ = (UniqueConstraint("user_id", "session_date", name="uq_daily_practice_user_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    session_date: Mapped[date] = mapped_column(Date, index=True)
    challenge_id: Mapped[int | None] = mapped_column(ForeignKey("daily_challenges.id", ondelete="SET NULL"), nullable=True)
    problem_id: Mapped[int] = mapped_column(ForeignKey("problems.id", ondelete="RESTRICT"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="IN_PROGRESS", index=True)
    submission_id: Mapped[int | None] = mapped_column(ForeignKey("code_submissions.id", ondelete="SET NULL"), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
