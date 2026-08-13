"""
=========================================================

SkillBattle

Battle Participant Model

Production SQLAlchemy 2.x Model

=========================================================
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    String,
    DateTime,
    ForeignKey,
    Integer,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.database.base import Base


class BattleParticipant(Base):

    __tablename__ = "battle_participants"

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
        index=True,
    )

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # ==========================================================
    # Battle Stats
    # ==========================================================

    score: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    rank: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    joined_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # ==========================================================
    # Relationships
    # ==========================================================

    battle = relationship(
        "BattleRoom",
        back_populates="participants",
    )

    user = relationship(
        "User",
    )

    # ==========================================================
    # Helpers
    # ==========================================================

    def __repr__(self) -> str:
        return (
            f"<BattleParticipant("
            f"user={self.user_id}, "
            f"battle={self.battle_id}, "
            f"score={self.score})>"
        )