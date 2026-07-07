from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ==========================================================
# Start Interview Request
# ==========================================================

class StartInterviewRequest(BaseModel):

    company: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    role: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    interview_type: str = Field(
        ...,
        description="Technical, HR, AI/ML, Frontend, Backend",
    )

    difficulty: str = Field(
        default="Medium",
    )

    total_questions: int = Field(
        default=5,
        ge=3,
        le=20,
    )


# ==========================================================
# Question
# ==========================================================

class InterviewQuestionResponse(BaseModel):

    id: int

    sequence: int

    question: str

    difficulty: str

    expected_topics: str

    model_config = {
        "from_attributes": True
    }


# ==========================================================
# Session Response
# ==========================================================

class InterviewSessionResponse(BaseModel):

    id: int

    company: str

    role: str

    interview_type: str

    difficulty: str

    total_questions: int

    overall_score: float

    status: str

    started_at: datetime

    finished_at: Optional[datetime]

    questions: List[InterviewQuestionResponse]

    model_config = {
        "from_attributes": True
    }


# ==========================================================
# Submit Answer
# ==========================================================

class SubmitAnswerRequest(BaseModel):

    question_id: int

    answer: str = Field(
        ...,
        min_length=5,
    )


# ==========================================================
# AI Evaluation
# ==========================================================

class AnswerEvaluationResponse(BaseModel):

    score: float

    feedback: str

    strengths: List[str]

    improvements: List[str]

    follow_up_question: Optional[str] = None


# ==========================================================
# Finish Interview
# ==========================================================

class FinishInterviewResponse(BaseModel):

    session_id: int

    overall_score: float

    total_questions: int

    completed_questions: int

    xp_earned: int

    passed: bool

    message: str


# ==========================================================
# History
# ==========================================================

class InterviewHistoryItem(BaseModel):

    id: int

    company: str

    role: str

    interview_type: str

    overall_score: float

    status: str

    started_at: datetime

    model_config = {
        "from_attributes": True
    }


class InterviewHistoryResponse(BaseModel):

    interviews: List[InterviewHistoryItem]


# ==========================================================
# Report
# ==========================================================

class InterviewReportResponse(BaseModel):

    company: str

    role: str

    interview_type: str

    score: float

    strengths: List[str]

    weaknesses: List[str]

    recommendations: List[str]


# ==========================================================
# AI JSON Validation Models
# ==========================================================

class AIInterviewQuestion(BaseModel):

    sequence: int

    question: str

    expected_topics: str

    difficulty: str


class AIInterview(BaseModel):

    questions: List[AIInterviewQuestion]


# ==========================================================
# AI Answer Evaluation
# ==========================================================

class AIEvaluation(BaseModel):

    score: float

    feedback: str

    strengths: List[str]

    improvements: List[str]

    follow_up_question: str