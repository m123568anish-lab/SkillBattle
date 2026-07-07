from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ==========================================================
# Request Models
# ==========================================================

class GenerateRoadmapRequest(BaseModel):
    """
    Request body for generating a new AI roadmap.
    """

    duration_weeks: int = Field(
        default=12,
        ge=8,
        le=24,
        description="Roadmap duration between 8 and 24 weeks",
    )


# ==========================================================
# Task Models
# ==========================================================

class RoadmapTaskResponse(BaseModel):
    id: int

    day: int

    topic: str

    difficulty: str

    estimated_minutes: int

    reward_xp: int

    completed: bool

    completed_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }


# ==========================================================
# Week Models
# ==========================================================

class RoadmapWeekResponse(BaseModel):
    id: int

    week_number: int

    title: str

    objective: str

    completion: int

    tasks: List[RoadmapTaskResponse]

    model_config = {
        "from_attributes": True
    }


# ==========================================================
# Main Roadmap Response
# ==========================================================

class RoadmapResponse(BaseModel):
    id: int

    title: str

    target_company: str

    duration_weeks: int

    estimated_hours: int

    progress: int

    status: str

    created_at: datetime

    weeks: List[RoadmapWeekResponse]

    model_config = {
        "from_attributes": True
    }


# ==========================================================
# Generate Roadmap Response
# ==========================================================

class GenerateRoadmapResponse(BaseModel):
    success: bool

    message: str

    roadmap_id: int


# ==========================================================
# Complete Task Response
# ==========================================================

class CompleteTaskResponse(BaseModel):
    success: bool

    message: str

    reward_xp: int

    total_progress: int


# ==========================================================
# Dashboard Widget Response
# ==========================================================

class CurrentRoadmapResponse(BaseModel):
    roadmap_title: str

    current_week: int

    total_weeks: int

    progress: int

    today_task: Optional[RoadmapTaskResponse] = None


# ==========================================================
# AI Roadmap JSON Schema
# (Expected response from Gemini)
# ==========================================================

class AITask(BaseModel):
    day: int

    topic: str

    difficulty: str

    estimated_minutes: int

    reward_xp: int


class AIWeek(BaseModel):
    week_number: int

    title: str

    objective: str

    tasks: List[AITask]


class AIRoadmap(BaseModel):
    title: str

    duration_weeks: int

    estimated_hours: int

    weeks: List[AIWeek]