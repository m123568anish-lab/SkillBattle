"""
=========================================================

SkillBattle

Battle Room Model

Production SQLAlchemy 2.x Model with Advanced Battle Engine support

=========================================================
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    String,
    DateTime,
    Integer,
    JSON,
    ForeignKey,
    Boolean,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.database.base import Base


class BattleRoom(Base):

    __tablename__ = "battle_rooms"

    # Primary Key
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    # Configuration Link
    config_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("battle_configs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Battle Information
    title: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )

    battle_type: Mapped[str] = mapped_column(
        String(50),
        default="general",
        nullable=False,
        index=True,
    )

    battle_mode: Mapped[str] = mapped_column(
        String(30),
        default="solo",
        nullable=False,
        index=True,
    )

    creator_id: Mapped[str | None] = mapped_column(
        String(36),
        nullable=True,
        index=True,
    )

    difficulty: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
    )

    problem_id: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="waiting",
        nullable=False,
        index=True,
    )

    max_players: Mapped[int] = mapped_column(
        Integer,
        default=2,
        nullable=False,
    )

    current_round: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )

    current_section_index: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    round_status: Mapped[str] = mapped_column(
        String(30),
        default="created",
        nullable=False,
        index=True,
    )

    # Context IDs
    company_id: Mapped[str | None] = mapped_column(
        String(36),
        nullable=True,
        index=True,
    )

    college_id: Mapped[str | None] = mapped_column(
        String(36),
        nullable=True,
        index=True,
    )

    # Structured Data
    sections_config: Mapped[list] = mapped_column(
        JSON,
        default=list,
        nullable=False,
    )

    questions_data: Mapped[list] = mapped_column(
        JSON,
        default=list,
        nullable=False,
    )

    anti_cheat_logs: Mapped[list] = mapped_column(
        JSON,
        default=list,
        nullable=False,
    )

    state_history: Mapped[list] = mapped_column(
        JSON,
        default=list,
        nullable=False,
    )

    # Battle Timing
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
        default=None,
    )

    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
        default=None,
    )

    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
        default=None,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    last_transition_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
        default=None,
    )

    # Relationships
    config = relationship("BattleConfig")

    participants = relationship(
        "BattleParticipant",
        back_populates="battle",
        cascade="all, delete-orphan",
    )

    submissions = relationship(
        "BattleSubmission",
        back_populates="battle",
        cascade="all, delete-orphan",
    )

    result = relationship(
        "BattleResult",
        back_populates="battle",
        uselist=False,
        cascade="all, delete-orphan",
    )

    @property
    def is_running(self) -> bool:
        return self.status == "running"

    @property
    def is_finished(self) -> bool:
        return self.status in ("finished", "completed", "finalized")

    def __repr__(self) -> str:
        return (
            f"<BattleRoom(id={self.id}, "
            f"title='{self.title}', "
            f"type='{self.battle_type}', "
            f"status='{self.status}')>"
        )