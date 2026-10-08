"""
=========================================================

SkillBattle

Battle Result Model

Production SQLAlchemy 2.x Model with Advanced Battle Engine support

=========================================================
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.database.base import Base


class BattleResult(Base):

    __tablename__ = "battle_results"

    # Primary Key
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    # Foreign Keys
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

    winner_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=True,
        index=True,
    )

    battle_type: Mapped[str] = mapped_column(
        String(50),
        default="general",
        nullable=False,
    )

    is_draw: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    # Statistics
    total_players: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )

    duration_seconds: Mapped[int] = mapped_column(
        Integer,
        default=0,
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

    accuracy_percentage: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )

    # Detailed Section & Skill Analysis
    section_scores: Mapped[dict] = mapped_column(
        JSON,
        default=dict,
        nullable=False,
    )

    question_breakdown: Mapped[list] = mapped_column(
        JSON,
        default=list,
        nullable=False,
    )

    skill_breakdown: Mapped[dict] = mapped_column(
        JSON,
        default=dict,
        nullable=False,
    )

    placement_readiness: Mapped[dict] = mapped_column(
        JSON,
        default=dict,
        nullable=False,
    )

    recommendations: Mapped[list] = mapped_column(
        JSON,
        default=list,
        nullable=False,
    )

    # Rating & XP Changes
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

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    battle = relationship(
        "BattleRoom",
        back_populates="result",
    )

    winner = relationship(
        "User",
    )

    @property
    def is_ranked(self) -> bool:
        return self.rating_change != 0

    def __repr__(self) -> str:
        return (
            f"<BattleResult("
            f"battle={self.battle_id}, "
            f"type={self.battle_type}, "
            f"winner={self.winner_id})>"
        )