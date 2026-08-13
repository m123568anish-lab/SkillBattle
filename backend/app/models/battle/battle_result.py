"""
=========================================================

SkillBattle

Battle Result Model

Production SQLAlchemy 2.x Model

=========================================================
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    String,
    Integer,
    Float,
    DateTime,
    ForeignKey,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.database.base import Base


class BattleResult(Base):

    __tablename__ = "battle_results"

    # ==========================================================
    # Primary Key
    # ==========================================================

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    # ==========================================================
    # Foreign Keys
    # ==========================================================

    battle_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey(
            "battle_rooms.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        unique=True,
        index=True,
    )

    winner_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # ==========================================================
    # Statistics
    # ==========================================================

    total_players: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    duration_seconds: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    winner_score: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    average_score: Mapped[float] = mapped_column(
        Float,
        default=0,
        nullable=False,
    )

    # ==========================================================
    # Rating Changes
    # ==========================================================

    rating_change: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    xp_earned: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    # ==========================================================
    # Timestamp
    # ==========================================================

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # ==========================================================
    # Relationships
    # ==========================================================

    battle = relationship(
        "BattleRoom",
        back_populates="result",
    )

    winner = relationship(
        "User",
    )

    # ==========================================================
    # Helpers
    # ==========================================================

    @property
    def is_ranked(self) -> bool:
        return self.rating_change != 0

    def __repr__(self) -> str:
        return (
            f"<BattleResult("
            f"battle={self.battle_id}, "
            f"winner={self.winner_id})>"
        )