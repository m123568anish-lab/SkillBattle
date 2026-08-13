"""
=========================================================

SkillBattle

Tournament Participant

=========================================================
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    String,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.database.base import Base


class TournamentParticipant(Base):

    __tablename__ = "tournament_participants"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    tournament_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("tournaments.id"),
    )

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id"),
    )

    seed: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    eliminated: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    joined_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )