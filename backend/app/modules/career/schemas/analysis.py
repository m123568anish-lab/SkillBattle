"""
=========================================================

SkillBattle

Analysis Schemas

=========================================================
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class AnalysisStatusResponse(BaseModel):

    resume_id: str

    status: str

    progress: int

    parsed: bool

    ai_processed: bool

    ats_score: int

    placement_score: int

    updated_at: datetime | None = None


class AnalysisResultResponse(BaseModel):

    resume_id: str

    status: str

    analysis: dict