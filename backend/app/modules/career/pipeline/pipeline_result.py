"""
=========================================================

SkillBattle

Pipeline Result Models

Standard response models for the
Career Analysis Pipeline.

=========================================================
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel
from pydantic import Field


# =========================================================
# Resume Metadata
# =========================================================

class ResumeResult(BaseModel):

    id: str

    filename: str

    uploaded_at: datetime


# =========================================================
# Pipeline Result
# =========================================================

class PipelineResult(BaseModel):

    success: bool = True

    message: str = "Analysis completed successfully."

    resume: ResumeResult

    contact: dict[str, Any]

    skills: dict[str, Any]

    education: dict[str, Any]

    experience: dict[str, Any]

    projects: dict[str, Any]

    certifications: dict[str, Any]

    resume_analysis: dict[str, Any]

    ats: dict[str, Any]

    job_match: dict[str, Any]

    placement: dict[str, Any]

    roadmap: dict[str, Any]

    portfolio: dict[str, Any]

    created_at: datetime = Field(
        default_factory=datetime.utcnow
    )


# =========================================================
# Pipeline Error
# =========================================================

class PipelineError(BaseModel):

    success: bool = False

    message: str

    error: str