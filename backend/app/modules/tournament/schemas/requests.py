from datetime import datetime

from pydantic import BaseModel, Field


class CreateTournamentRequest(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    description: str = Field(max_length=500)
    tournament_type: str = Field(default="single_elimination", max_length=40)
    max_players: int = Field(default=16, ge=2, le=256)
    registration_end: datetime
    starts_at: datetime


class JoinTournamentRequest(BaseModel):

    tournament_id: str