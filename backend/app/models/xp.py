from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import (
    mapped_column,
    Mapped,
)

from app.database.base import Base


class XP(Base):
    __tablename__ = "xp"
    __table_args__ = (UniqueConstraint("user_id", name="uq_xp_user_id"),)

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    total_xp: Mapped[int] = mapped_column(
        Integer,
        default=0,
        index=True,
    )

    weekly_xp: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    daily_xp: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    level: Mapped[int] = mapped_column(
        Integer,
        default=1,
    )

    rank: Mapped[int] = mapped_column(
        Integer,
        default=99999,
    )

    @property
    def next_level_xp(self) -> int:
        return self.level * 500


class XPLedger(Base):
    """
    Authoritative ledger of individual verified XP award events.
    Guarantees idempotency via unique (user_id, source, reference_id).
    """
    __tablename__ = "xp_ledger"
    __table_args__ = (
        UniqueConstraint("user_id", "source", "reference_id", name="uq_xp_ledger_user_source_ref"),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    source: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="general",
        index=True,
    )

    reference_id: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )