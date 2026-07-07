from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ==========================================================
# Create Battle
# ==========================================================

class CreateBattleRequest(BaseModel):

    title: str = Field(..., min_length=3, max_length=120)

    difficulty: str

    problem_id: int

    max_players: int = Field(default=2, ge=2, le=8)


# ==========================================================
# Join Battle
# ==========================================================

class JoinBattleRequest(BaseModel):

    battle_id: str


# ==========================================================
# Leave Battle
# ==========================================================

class LeaveBattleRequest(BaseModel):

    battle_id: str


# ==========================================================
# Battle Room
# ==========================================================

class BattleResponse(BaseModel):

    id: str

    title: str

    difficulty: str

    problem_id: int

    status: str

    max_players: int

    created_at: datetime

    class Config:

        from_attributes = True


# ==========================================================
# Participant
# ==========================================================

class BattleParticipantResponse(BaseModel):

    id: str

    battle_id: str

    user_id: str

    score: int

    rank: int

    joined_at: datetime

    class Config:

        from_attributes = True


# ==========================================================
# Submission
# ==========================================================

class BattleSubmissionResponse(BaseModel):

    id: str

    battle_id: str

    user_id: str

    language: str

    verdict: str

    passed_tests: int

    total_tests: int

    submitted_at: datetime

    class Config:

        from_attributes = True


# ==========================================================
# Battle Result
# ==========================================================

class BattleResultResponse(BaseModel):

    id: str

    battle_id: str

    winner_id: str

    total_players: int

    duration_seconds: int

    created_at: datetime

    class Config:

        from_attributes = True


# ==========================================================
# Live Scoreboard
# ==========================================================

class LiveScoreResponse(BaseModel):

    user_id: str

    score: int

    rank: int


# ==========================================================
# Battle State
# ==========================================================

class BattleStateResponse(BaseModel):

    battle_id: str

    status: str

    players: int

    remaining_seconds: int