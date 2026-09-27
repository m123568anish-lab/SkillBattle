"""
=========================================================

SkillBattle

Battle Submission Model

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
    DateTime,
    ForeignKey,
    Text,
    JSON,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.database.base import Base


class BattleSubmission(Base):

    __tablename__ = "battle_submissions"

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

    # Question & Section Metadata
    question_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        index=True,
    )

    section_index: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    question_type: Mapped[str] = mapped_column(
        String(30),
        default="coding",
        nullable=False,
    )

    # Question Specific Input
    mcq_option: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    language: Mapped[str] = mapped_column(
        String(30),
        default="python",
        nullable=False,
    )

    language_version: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        default=None,
    )

    source_code: Mapped[str] = mapped_column(
        Text,
        default="",
        nullable=False,
    )

    # Judge & Score Result
    verdict: Mapped[str] = mapped_column(
        String(50),
        default="Pending",
        nullable=False,
        index=True,
    )

    runtime_ms: Mapped[float] = mapped_column(
        Float,
        default=0,
        nullable=False,
    )

    memory_mb: Mapped[float] = mapped_column(
        Float,
        default=0,
        nullable=False,
    )

    passed_tests: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    total_tests: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    score: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    score_earned: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )

    max_possible_score: Mapped[float] = mapped_column(
        Float,
        default=100.0,
        nullable=False,
    )

    time_taken_seconds: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    telemetry: Mapped[dict] = mapped_column(
        JSON,
        default=dict,
        nullable=False,
    )

    submitted_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    battle = relationship(
        "BattleRoom",
        back_populates="submissions",
    )

    user = relationship(
        "User",
    )

    @property
    def accepted(self) -> bool:
        return self.verdict in ("Accepted", "Correct")

    def __repr__(self) -> str:
        return (
            f"<BattleSubmission("
            f"user={self.user_id}, "
            f"battle={self.battle_id}, "
            f"type={self.question_type}, "
            f"verdict={self.verdict})>"
        )