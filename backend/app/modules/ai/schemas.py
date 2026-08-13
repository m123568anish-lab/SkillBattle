"""
=========================================================

SkillBattle

AI Schemas

=========================================================
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


# ==========================================================
# Chat
# ==========================================================

class AIChatRequest(BaseModel):

    message: str = Field(..., min_length=1)

    conversation_id: Optional[str] = None


class AIChatResponse(BaseModel):

    response: str


# ==========================================================
# Roadmap
# ==========================================================

class RoadmapRequest(BaseModel):

    target_role: str

    current_level: str

    weekly_hours: int = 10


# ==========================================================
# Resume
# ==========================================================

class ResumeReviewRequest(BaseModel):

    resume_text: str


# ==========================================================
# Interview
# ==========================================================

class InterviewRequest(BaseModel):

    role: str

    level: str


# ==========================================================
# Recommendation
# ==========================================================

class RecommendationRequest(BaseModel):

    topic: str

    skill_level: str