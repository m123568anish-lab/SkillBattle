"""
=========================================================

SkillBattle

Battle Room Model

Production SQLAlchemy 2.x Model

=========================================================
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    String,
    DateTime,
    Integer,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.database.base import Base


class BattleRoom(Base):

    __tablename__ = "battle_rooms"

    # ==========================================================
    # Primary Key
    # ==========================================================

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    # ==========================================================
    # Battle Information
    # ==========================================================

    title: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )

    difficulty: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
    )

    problem_id: Mapped[int] = mapped_column(
        Integer,
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

    # ==========================================================
    # Battle Timing
    # ==========================================================

    started_at: Mapped[datetime | None] = mapped_column(
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

    # ==========================================================
    # Relationships
    # ==========================================================

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

    # ==========================================================
    # Helpers
    # ==========================================================

    @property
    def is_running(self) -> bool:
        return self.status == "running"

    @property
    def is_finished(self) -> bool:
        return self.status == "finished"

    def __repr__(self) -> str:
        return (
            f"<BattleRoom(id={self.id}, "
            f"title='{self.title}', "
            f"status='{self.status}')>"
        )