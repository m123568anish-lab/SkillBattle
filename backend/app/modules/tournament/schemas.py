"""
=========================================================

SkillBattle

Tournament Schemas

=========================================================
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel
from pydantic import Field


# ==========================================================
# Create Tournament
# ==========================================================

class CreateTournamentRequest(BaseModel):

    title: str = Field(
        ...,
        min_length=3,
        max_length=120,
    )

    description: str

    max_players: int = Field(
        default=16,
        ge=2,
        le=256,
    )

    tournament_type: str = "single_elimination"

    registration_end: datetime

    starts_at: datetime


# ==========================================================
# Join Tournament
# ==========================================================

class JoinTournamentRequest(BaseModel):

    tournament_id: str


# ==========================================================
# Tournament Response
# ==========================================================

class TournamentResponse(BaseModel):

    id: str

    title: str

    description: str

    tournament_type: str

    status: str

    max_players: int

    registered_players: int

    starts_at: datetime

    registration_end: datetime

    class Config:

        from_attributes = True


# ==========================================================
# Participant
# ==========================================================

class TournamentParticipantResponse(BaseModel):

    id: str

    tournament_id: str

    user_id: str

    seed: int

    eliminated: bool

    class Config:

        from_attributes = True


# ==========================================================
# Match
# ==========================================================

class TournamentMatchResponse(BaseModel):

    id: str

    tournament_id: str

    round_number: int

    battle_id: str | None

    player_one_id: str | None

    player_two_id: str | None

    winner_id: str | None

    class Config:

        from_attributes = True