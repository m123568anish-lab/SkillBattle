"""
=========================================================

SkillBattle

Tournament Match

=========================================================
"""

from __future__ import annotations

import uuid

from sqlalchemy import (
    String,
    Integer,
    ForeignKey,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.database.base import Base


class TournamentMatch(Base):

    __tablename__ = "tournament_matches"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    tournament_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("tournaments.id"),
    )

    round_number: Mapped[int] = mapped_column(
        Integer,
    )

    battle_id: Mapped[str | None] = mapped_column(
        String(36),
        nullable=True,
    )

    player_one_id: Mapped[str | None] = mapped_column(
        String(36),
        nullable=True,
    )

    player_two_id: Mapped[str | None] = mapped_column(
        String(36),
        nullable=True,
    )

    winner_id: Mapped[str | None] = mapped_column(
        String(36),
        nullable=True,
    )