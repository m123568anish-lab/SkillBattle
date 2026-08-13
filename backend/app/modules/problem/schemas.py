"""
=========================================================

SkillBattle

Problem Schemas

Production Version

=========================================================
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


# ==========================================================
# Create
# ==========================================================

class CreateProblemRequest(BaseModel):

    title: str = Field(..., min_length=3, max_length=200)

    slug: str

    difficulty: str

    category: str

    description: str

    input_format: str

    output_format: str

    constraints: str

    explanation: str = ""

    xp_reward: int = 100

    time_limit: int = 2

    memory_limit: int = 256


# ==========================================================
# Update
# ==========================================================

class UpdateProblemRequest(BaseModel):

    title: str | None = None

    difficulty: str | None = None

    category: str | None = None

    description: str | None = None

    input_format: str | None = None

    output_format: str | None = None

    constraints: str | None = None

    explanation: str | None = None

    xp_reward: int | None = None

    time_limit: int | None = None

    memory_limit: int | None = None

    is_active: bool | None = None


# ==========================================================
# Response
# ==========================================================

class ProblemResponse(BaseModel):

    id: int

    title: str

    slug: str

    difficulty: str

    category: str

    description: str

    input_format: str

    output_format: str

    constraints: str

    explanation: str

    xp_reward: int

    time_limit: int

    memory_limit: int

    is_active: bool

    created_at: datetime

    model_config = {
        "from_attributes": True
    }


# ==========================================================
# Search
# ==========================================================

class SearchProblemRequest(BaseModel):

    keyword: str = ""


# ==========================================================
# Pagination
# ==========================================================

class PaginationResponse(BaseModel):

    total: int

    page: int

    page_size: int

    items: list[ProblemResponse]