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
    UniqueConstraint,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.database.base import Base


class BattleResult(Base):

    __tablename__ = "battle_results"
    __table_args__ = (
        UniqueConstraint("battle_id", "participant_id", name="uq_battle_result_battle_participant"),
    )

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

    participant_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=True,
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

    knowledge_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )

    coding_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )

    overall_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )

    accuracy: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )

    completion_status: Mapped[str] = mapped_column(
        String(30),
        default="pending",
        nullable=False,
    )

    result_status: Mapped[str] = mapped_column(
        String(30),
        default="result",
        nullable=False,
    )

    rank: Mapped[str | None] = mapped_column(
        String(30),
        default="PENDING",
        nullable=True,
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

    finalized_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        default=None,
        nullable=True,
    )

    scoring_metadata: Mapped[dict] = mapped_column(
        JSON,
        default=dict,
        nullable=False,
    )

    # Relationships
    battle = relationship(
        "BattleRoom",
        back_populates="result",
    )

    winner = relationship(
        "User",
        foreign_keys=[winner_id],
    )

    participant = relationship(
        "User",
        foreign_keys=[participant_id],
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