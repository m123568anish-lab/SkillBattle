from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ==========================================================
# Create Battle
# ==========================================================

from enum import Enum

class BattleType(str, Enum):
    SOLO = "solo"
    DUO = "duo"
    SQUAD = "squad"

class CreateBattleRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=120)
    difficulty: str
    problem_id: int
    max_players: int = Field(default=2, ge=2, le=8)
    battle_type: BattleType = Field(default=BattleType.DUO, description="Type of battle: solo, duo, squad")


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

# ==========================================================
# Matchmaking
# ==========================================================

class MatchmakingRequest(BaseModel):

    difficulty: str = Field(default="medium")

    language: str = Field(default="python")

    ranked: bool = True

    mode: str = Field(default="global", description="Matchmaking mode: global or friend")

    friend_id: str | None = Field(default=None, description="Optional friend user ID for friend battles")


class MatchmakingResponse(BaseModel):

    queue_id: str

    estimated_wait: int

    players_waiting: int

# ==========================================================
# Battle Timer
# ==========================================================

class BattleTimerResponse(BaseModel):

    battle_id: str

    started_at: datetime

    remaining_seconds: int

    total_seconds: int

# ==========================================================
# Submit Code
# ==========================================================

class SubmitCodeRequest(BaseModel):

    battle_id: str

    language: str

    source_code: str

# ==========================================================
# Judge Result
# ==========================================================

class JudgeResultResponse(BaseModel):

    verdict: str

    runtime_ms: float

    memory_mb: float

    passed_tests: int

    total_tests: int

# ==========================================================
# Leaderboard
# ==========================================================

class LeaderboardEntry(BaseModel):

    rank: int

    username: str

    score: int

    rating: int


class LeaderboardResponse(BaseModel):

    leaderboard: list[LeaderboardEntry]

# ==========================================================
# Battle History
# ==========================================================

class BattleHistoryResponse(BaseModel):

    battle_id: str

    title: str

    result: str

    score: int

    rating_change: int

    played_at: datetime
class MCQResult(BaseModel):
    category: str
    correct: bool

class SoloFinishRequest(BaseModel):
    xp_earned: int
    mcq_results: list[MCQResult]
    coding_solved: bool

