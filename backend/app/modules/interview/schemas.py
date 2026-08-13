"""
=========================================================

Interview Schemas

=========================================================
"""

from datetime import datetime

from pydantic import BaseModel


class InterviewCreate(BaseModel):

    difficulty: str = "medium"

    language: str = "python"

    total_questions: int = 5


class InterviewResponse(BaseModel):

    id: str

    difficulty: str

    language: str

    status: str

    current_question: int

    total_questions: int

    score: int

    started_at: datetime

    class Config:

        from_attributes = True