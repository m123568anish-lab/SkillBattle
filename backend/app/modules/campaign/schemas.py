from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class QuestionOption(BaseModel):
    id: int
    text: str
    options: List[str]

class CampaignLevelResponse(BaseModel):
    level_id: int
    title: str
    description: str
    questions: List[QuestionOption]

class LevelStatus(BaseModel):
    level_id: int
    title: str
    description: str
    stars: int
    unlocked: bool

class TrackStatus(BaseModel):
    track: str
    current_level: int
    levels: List[LevelStatus]

class CampaignStatusResponse(BaseModel):
    rank: str
    points: int
    tracks: List[TrackStatus]

class LevelAnswer(BaseModel):
    question_id: int
    selected_option: int

class LevelSubmitRequest(BaseModel):
    track: str
    level_id: int
    answers: List[LevelAnswer]

class LevelSubmitResponse(BaseModel):
    score: int
    total: int
    stars: int
    points_earned: int
    unlocked_next: bool
    rank_upgraded: bool
    new_rank: str
    correct_count: int
