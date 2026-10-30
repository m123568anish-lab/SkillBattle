from __future__ import annotations

from datetime import date, datetime
from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.database.base import Base


class Streak(Base):
    """
    Authoritative user streak summary.
    Maintains current streak, all-time best streak, and last qualifying activity date.
    """
    __tablename__ = "streak"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_streak_user_id"),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    current_streak: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    best_streak: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    last_active: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    last_activity_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    @property
    def longest_streak(self) -> int:
        return self.best_streak


class UserDailyActivity(Base):
    """
    Append-only daily activity record for streak tracking and consistency audit.
    Guarantees at the database level that qualifying activity is recorded at most
    once per user per calendar day.
    """
    __tablename__ = "user_daily_activities"
    __table_args__ = (
        UniqueConstraint("user_id", "activity_date", name="uq_user_daily_activity"),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    activity_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    activity_type: Mapped[str] = mapped_column(
        String(50),
        default="practice",
        nullable=False,
    )

    reference_id: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    xp_earned: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
