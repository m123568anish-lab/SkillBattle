"""
=========================================================
SkillBattle Career Platform

Request Schemas

=========================================================
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import Field
from pydantic import HttpUrl


# =========================================================
# Resume
# =========================================================

class ResumeUploadRequest(BaseModel):

    model_config = ConfigDict(
        extra="forbid",
    )

    resume_name: str = Field(
        min_length=2,
        max_length=120,
    )

    file_type: Literal[
        "pdf",
        "docx",
    ]


# =========================================================
# ATS Analysis
# =========================================================

class ATSScoreRequest(BaseModel):

    model_config = ConfigDict(
        extra="forbid",
    )

    resume_id: str

    optimize: bool = True


# =========================================================
# Resume vs Job Description
# =========================================================

class ResumeJobMatchRequest(BaseModel):

    model_config = ConfigDict(
        extra="forbid",
    )

    resume_id: str

    job_id: str


# =========================================================
# Job Matching
# =========================================================

class JobMatchingRequest(BaseModel):

    model_config = ConfigDict(
        extra="forbid",
    )

    resume_id: str

    target_role: str

    preferred_location: str | None = None

    minimum_salary: int | None = None


# =========================================================
# Portfolio Analysis
# =========================================================

class PortfolioAnalysisRequest(BaseModel):

    model_config = ConfigDict(
        extra="forbid",
    )

    portfolio_id: str


# =========================================================
# Career Roadmap
# =========================================================

class RoadmapRequest(BaseModel):

    model_config = ConfigDict(
        extra="forbid",
    )

    current_role: str

    target_role: str

    months: int = Field(
        default=6,
        ge=1,
        le=36,
    )


# =========================================================
# Placement Readiness
# =========================================================

class PlacementReadinessRequest(BaseModel):

    model_config = ConfigDict(
        extra="forbid",
    )

    profile_id: str

    company: str | None = None


# =========================================================
# Cover Letter
# =========================================================

class CoverLetterRequest(BaseModel):

    model_config = ConfigDict(
        extra="forbid",
    )

    profile_id: str

    company: str

    job_title: str

    job_description: str


# =========================================================
# Career Mentor
# =========================================================

class CareerMentorRequest(BaseModel):

    model_config = ConfigDict(
        extra="forbid",
    )

    profile_id: str

    message: str = Field(
        min_length=2,
        max_length=3000,
    )


# =========================================================
# Resume Screening
# =========================================================

class ResumeScreeningRequest(BaseModel):

    model_config = ConfigDict(
        extra="forbid",
    )

    template: str

    include_projects: bool = True

    include_certifications: bool = True

    include_achievements: bool = True


# =========================================================
# Portfolio Import
# =========================================================

class PortfolioImportRequest(BaseModel):

    model_config = ConfigDict(
        extra="forbid",
    )

    github_url: HttpUrl

    linkedin_url: HttpUrl | None = None


# =========================================================
# Skill Gap
# =========================================================

class SkillGapRequest(BaseModel):

    model_config = ConfigDict(
        extra="forbid",
    )

    profile_id: str

    target_company: str

    target_role: str