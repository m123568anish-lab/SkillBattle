from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ==========================================================
# Create Tournament
# ==========================================================

class CreateTournamentRequest(BaseModel):

    title: str = Field(..., min_length=3, max_length=150)

    description: str = Field(..., max_length=500)

    difficulty: str

    max_players: int = Field(
        default=16,
        ge=2,
        le=256,
    )


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

    difficulty: str

    max_players: int

    status: str

    created_at: datetime

    class Config:

        from_attributes = True


# ==========================================================
# Tournament Participant
# ==========================================================

class TournamentParticipantResponse(BaseModel):

    id: str

    tournament_id: str

    user_id: str

    joined_at: datetime

    class Config:

        from_attributes = True


# ==========================================================
# Tournament Match
# ==========================================================

class TournamentMatchResponse(BaseModel):

    id: str

    tournament_id: str

    round_number: int

    battle_id: Optional[str]

    player_one_id: str

    player_two_id: str

    winner_id: Optional[str]

    class Config:

        from_attributes = True


# ==========================================================
# Tournament Bracket
# ==========================================================

class TournamentBracketResponse(BaseModel):

    tournament_id: str

    rounds: list[TournamentMatchResponse]


# ==========================================================
# Tournament Leaderboard
# ==========================================================

class TournamentLeaderboardEntry(BaseModel):

    user_id: str

    wins: int

    losses: int

    position: int


class TournamentLeaderboardResponse(BaseModel):

    tournament_id: str

    players: list[TournamentLeaderboardEntry]