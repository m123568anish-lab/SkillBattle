"""
=========================================================
SkillBattle Career Platform

Response Schemas

=========================================================
"""

from __future__ import annotations

from typing import List

from pydantic import BaseModel
from pydantic import Field


# =========================================================
# Resume Analysis
# =========================================================

class ResumeAnalysisResponse(BaseModel):

    full_name: str

    email: str

    phone: str

    ats_score: float

    extracted_skills: List[str]

    projects: int

    certifications: int

    suggestions: List[str]


# =========================================================
# ATS Score
# =========================================================

class ATSResponse(BaseModel):

    overall_score: float

    formatting_score: float

    keyword_score: float

    grammar_score: float

    readability_score: float

    missing_keywords: List[str]

    suggestions: List[str]


# =========================================================
# Job Match
# =========================================================

class JobMatchResponse(BaseModel):

    company: str

    role: str

    match_percentage: float

    matched_skills: List[str]

    missing_skills: List[str]

    recommendations: List[str]


# =========================================================
# Portfolio
# =========================================================

class PortfolioAnalysisResponse(BaseModel):

    profile_score: float

    total_projects: int

    featured_projects: int

    ai_projects: int

    open_source_score: float

    suggestions: List[str]


# =========================================================
# Skill Gap
# =========================================================

class SkillGapResponse(BaseModel):

    target_company: str

    target_role: str

    current_skills: List[str]

    missing_skills: List[str]

    recommended_projects: List[str]

    recommended_certifications: List[str]


# =========================================================
# Learning Roadmap
# =========================================================

class RoadmapResponse(BaseModel):

    title: str

    estimated_months: int

    phases: List[str]

    projects: List[str]

    certifications: List[str]


# =========================================================
# Placement Readiness
# =========================================================

class PlacementReadinessResponse(BaseModel):

    readiness_score: float

    coding_score: float

    resume_score: float

    interview_score: float

    portfolio_score: float

    communication_score: float

    strengths: List[str]

    weaknesses: List[str]

    next_steps: List[str]


# =========================================================
# Cover Letter
# =========================================================

class CoverLetterResponse(BaseModel):

    company: str

    role: str

    cover_letter: str


# =========================================================
# Career Mentor
# =========================================================

class CareerMentorResponse(BaseModel):

    answer: str

    follow_up_questions: List[str]

    resources: List[str]


# =========================================================
# Dashboard
# =========================================================

class CareerDashboardResponse(BaseModel):

    profile_completion: int = Field(

        ge=0,

        le=100,

    )

    overall_score: float

    ats_score: float

    placement_score: float

    coding_rating: int

    interview_score: float

    portfolio_score: float

    total_skills: int

    total_projects: int

    recommendations: List[str]

    achievements: List[str]