from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field


# ==========================================================
# Enums
# ==========================================================

class BattleTypeEnum(str, Enum):
    GENERAL = "general"
    PLACEMENT = "placement"
    COMPANY = "company"
    COLLEGE = "college"
    TOURNAMENT = "tournament"
    PRACTICE = "practice"


class QuestionTypeEnum(str, Enum):
    MCQ = "mcq"
    CODING = "coding"
    DEBUGGING = "debugging"
    TECHNICAL = "technical"


class BattleStateEnum(str, Enum):
    CREATED = "created"
    WAITING = "waiting"
    MATCHED = "matched"
    READY = "ready"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    EVALUATING = "evaluating"
    RESULT = "result"
    FINALIZED = "finalized"


# Legacy compatibility enum
class BattleType(str, Enum):
    SOLO = "solo"
    DUO = "duo"
    SQUAD = "squad"


# ==========================================================
# Battle Section & Config
# ==========================================================

class BattleSectionConfig(BaseModel):
    title: str = Field(..., min_length=2, max_length=100)
    question_type: QuestionTypeEnum
    skill_category: Optional[str] = Field(default=None, max_length=100)
    question_count: int = Field(default=1, ge=1, le=50)
    weight: float = Field(default=1.0, ge=0.0, le=1.0)
    duration_minutes: int = Field(default=10, ge=1, le=180)
    negative_marking: bool = False


class BattleConfigCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: str = Field(default="")
    battle_type: BattleTypeEnum = Field(default=BattleTypeEnum.GENERAL)
    difficulty: str = Field(default="medium")
    duration_minutes: int = Field(default=30, ge=1, le=180)
    question_count: int = Field(default=5, ge=1, le=50)
    sections: List[BattleSectionConfig] = Field(default_factory=list)
    allowed_languages: List[str] = Field(default_factory=lambda: ["python", "javascript", "cpp", "java", "sql"])
    scoring_rules: Dict[str, Any] = Field(default_factory=dict)
    negative_marking: bool = False
    visibility: str = Field(default="public")
    company_id: Optional[int] = None
    college_id: Optional[int] = None
    job_id: Optional[int] = None


class BattleConfigResponse(BaseModel):
    id: str
    title: str
    description: str
    battle_type: str
    difficulty: str
    duration_minutes: int
    question_count: int
    sections: List[Dict[str, Any]]
    allowed_languages: List[str]
    scoring_rules: Dict[str, Any]
    negative_marking: bool
    visibility: str
    company_id: Optional[int] = None
    college_id: Optional[int] = None
    job_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================================
# Create / Join Battle
# ==========================================================

class CreateBattleRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=120)
    difficulty: str = Field(default="medium")
    problem_id: int = Field(default=1)
    config_id: Optional[str] = None
    battle_type: BattleTypeEnum = Field(default=BattleTypeEnum.GENERAL)
    max_players: int = Field(default=2, ge=1, le=16)


class JoinBattleRequest(BaseModel):
    battle_id: str


class LeaveBattleRequest(BaseModel):
    battle_id: str


# ==========================================================
# Battle Room & Participant Response
# ==========================================================

class BattleResponse(BaseModel):
    id: str
    title: str
    difficulty: str
    problem_id: int
    status: str
    max_players: int
    config_id: Optional[str] = None
    battle_type: str = "general"
    current_section_index: int = 0
    sections_config: List[Dict[str, Any]] = Field(default_factory=list)
    questions_data: List[Dict[str, Any]] = Field(default_factory=list)
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


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
# Submissions & Answers
# ==========================================================

class SubmitAnswerRequest(BaseModel):
    battle_id: str
    question_id: Optional[int] = None
    section_index: int = 0
    question_type: QuestionTypeEnum
    mcq_option: Optional[str] = None
    source_code: Optional[str] = None
    language: str = "python"
    time_taken_seconds: int = 0
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class SubmitCodeRequest(BaseModel):
    battle_id: str
    language: str
    source_code: str


class BattleSubmissionResponse(BaseModel):
    id: str
    battle_id: str
    user_id: str
    question_id: Optional[int] = None
    section_index: int = 0
    question_type: str = "coding"
    mcq_option: Optional[str] = None
    language: str
    verdict: str
    score_earned: float = 0.0
    passed_tests: int = 0
    total_tests: int = 0
    submitted_at: datetime

    class Config:
        from_attributes = True


# ==========================================================
# Battle Results & Placement Readiness
# ==========================================================

class BattleResultResponse(BaseModel):
    id: str
    battle_id: str
    winner_id: Optional[str] = None
    battle_type: str = "general"
    is_draw: bool = False
    total_players: int
    duration_seconds: int
    winner_score: int = 0
    average_score: float = 0.0
    accuracy_percentage: float = 0.0
    section_scores: Dict[str, Any] = Field(default_factory=dict)
    question_breakdown: List[Dict[str, Any]] = Field(default_factory=list)
    skill_breakdown: Dict[str, Any] = Field(default_factory=dict)
    placement_readiness: Dict[str, Any] = Field(default_factory=dict)
    recommendations: List[Any] = Field(default_factory=list)
    xp_earned: int = 0
    rating_change: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================================
# Matchmaking & Other
# ==========================================================

class MatchmakingRequest(BaseModel):
    difficulty: str = Field(default="medium")
    language: str = Field(default="python")
    battle_type: BattleTypeEnum = Field(default=BattleTypeEnum.GENERAL)
    ranked: bool = True
    mode: str = Field(default="global", description="Matchmaking mode: global or friend")
    friend_id: Optional[str] = Field(default=None, description="Optional friend user ID")


class MatchmakingResponse(BaseModel):
    queue_id: str
    estimated_wait: int
    players_waiting: int


class LiveScoreResponse(BaseModel):
    user_id: str
    score: int
    rank: int


class BattleStateResponse(BaseModel):
    battle_id: str
    status: str
    players: int
    remaining_seconds: int
    current_section: int = 0
    sections: List[Dict[str, Any]] = Field(default_factory=list)


class BattleTimerResponse(BaseModel):
    battle_id: str
    started_at: datetime
    remaining_seconds: int
    total_seconds: int


class JudgeResultResponse(BaseModel):
    verdict: str
    runtime_ms: float
    memory_mb: float
    passed_tests: int
    total_tests: int


class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    score: int
    rating: int


class LeaderboardResponse(BaseModel):
    leaderboard: List[LeaderboardEntry]


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
    xp_earned: int = 0
    mcq_results: List[MCQResult] = Field(default_factory=list)
    coding_solved: bool = False
