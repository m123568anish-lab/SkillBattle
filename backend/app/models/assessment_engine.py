"""
=========================================================
SkillBattle V3 — Unified Assessment & Evaluation Engine Models
=========================================================
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    String,
    Integer,
    Boolean,
    DateTime,
    Float,
    Text,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.question import SafeJSON


# ==========================================================
# 1. Assessment Definition (Unified Configurable Engine)
# ==========================================================

class UnifiedAssessment(Base):
    __tablename__ = "unified_assessments"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        index=True,
    )

    description: Mapped[str] = mapped_column(
        Text,
        default="",
    )

    assessment_type: Mapped[str] = mapped_column(
        String(50),
        default="GENERAL",
        index=True,
        nullable=False,
    )  # GENERAL, PRACTICE, PLACEMENT, COMPANY, COLLEGE, TOURNAMENT, MOCK_INTERVIEW, SKILL_TEST

    difficulty: Mapped[str] = mapped_column(
        String(30),
        default="MEDIUM",
        index=True,
        nullable=False,
    )

    duration_minutes: Mapped[int] = mapped_column(
        Integer,
        default=60,
        nullable=False,
    )

    total_questions: Mapped[int] = mapped_column(
        Integer,
        default=10,
        nullable=False,
    )

    passing_score: Mapped[float] = mapped_column(
        Float,
        default=60.0,
        nullable=False,
    )

    negative_marking: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    randomize_questions: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    sections_json: Mapped[list] = mapped_column(
        SafeJSON,
        default=list,
        nullable=False,
    )  # [{ "name": "Aptitude", "order": 1, "question_count": 5, "marks": 2.0, "negative_marks": 0.5 }]

    scoring_rules: Mapped[dict] = mapped_column(
        SafeJSON,
        default=lambda: {
            "mcq_weight": 0.2,
            "coding_weight": 0.5,
            "debugging_weight": 0.15,
            "sql_weight": 0.15,
            "time_bonus": False,
        },
        nullable=False,
    )

    allowed_languages: Mapped[list] = mapped_column(
        SafeJSON,
        default=lambda: ["python", "javascript", "cpp", "java", "sql"],
        nullable=False,
    )

    attempt_limit: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )

    start_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
    )

    end_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
    )

    is_public: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    college_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        index=True,
    )

    company_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        nullable=True,
        index=True,
    )

    created_by_user_id: Mapped[str] = mapped_column(
        String(36),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )


# ==========================================================
# 2. Assessment Attempt (Session & Server-Authoritative Timer)
# ==========================================================

class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    assessment_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("unified_assessments.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="NOT_STARTED",
        index=True,
        nullable=False,
    )  # NOT_STARTED, IN_PROGRESS, SUBMITTED, EVALUATING, COMPLETED, EXPIRED, CANCELLED

    start_time: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    end_time: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )  # Server calculated expected cutoff time

    submitted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
    )

    current_question_index: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    answers_json: Mapped[dict] = mapped_column(
        SafeJSON,
        default=dict,
        nullable=False,
    )  # { "q1_id": { "answer": "A", "code": "...", "submitted_at": "..." } }

    section_progress_json: Mapped[dict] = mapped_column(
        SafeJSON,
        default=dict,
        nullable=False,
    )

    question_sequence: Mapped[list] = mapped_column(
        SafeJSON,
        default=list,
        nullable=False,
    )  # Ordered array of question IDs assigned to this session

    score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )

    max_possible_score: Mapped[float] = mapped_column(
        Float,
        default=100.0,
        nullable=False,
    )

    percentage: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )

    is_passed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    evaluation_summary: Mapped[dict] = mapped_column(
        SafeJSON,
        default=dict,
        nullable=False,
    )

    integrity_signals: Mapped[dict] = mapped_column(
        SafeJSON,
        default=lambda: {
            "tab_switch_count": 0,
            "copy_paste_count": 0,
            "rapid_answers": 0,
            "session_reconnects": 0,
            "unusual_timing_flags": [],
        },
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )


# ==========================================================
# 3. Assessment Individual Submission Record
# ==========================================================

class AssessmentQuestionSubmission(Base):
    __tablename__ = "assessment_question_submissions"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    attempt_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("assessment_attempts.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    assessment_id: Mapped[str] = mapped_column(
        String(36),
        index=True,
        nullable=False,
    )

    question_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("questions.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    user_id: Mapped[str] = mapped_column(
        String(36),
        index=True,
        nullable=False,
    )

    question_type: Mapped[str] = mapped_column(
        String(30),
        default="CODING",
        nullable=False,
    )

    submitted_answer: Mapped[str] = mapped_column(
        Text,
        default="",
    )

    language: Mapped[str] = mapped_column(
        String(30),
        default="python",
    )

    execution_status: Mapped[str] = mapped_column(
        String(30),
        default="QUEUED",
        index=True,
        nullable=False,
    )  # QUEUED, RUNNING, ACCEPTED, PARTIAL, WRONG_ANSWER, TIME_LIMIT, MEMORY_LIMIT, COMPILE_ERROR, RUNTIME_ERROR, FAILED

    score_awarded: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )

    max_score: Mapped[float] = mapped_column(
        Float,
        default=10.0,
        nullable=False,
    )

    passed_test_cases: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    total_test_cases: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    execution_time_ms: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    memory_kb: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    error_output: Mapped[str] = mapped_column(
        Text,
        default="",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )


# ==========================================================
# 4. Student Evidence-Based Skill Profile & Placement Model
# ==========================================================

class StudentSkillProfile(Base):
    __tablename__ = "student_skill_profiles"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )

    programming_skills: Mapped[dict] = mapped_column(
        SafeJSON,
        default=lambda: {"python": 50, "cpp": 50, "java": 50, "javascript": 50},
        nullable=False,
    )

    core_cs_skills: Mapped[dict] = mapped_column(
        SafeJSON,
        default=lambda: {"dsa": 50, "dbms": 50, "os": 50, "networks": 50, "system_design": 40},
        nullable=False,
    )

    practical_skills: Mapped[dict] = mapped_column(
        SafeJSON,
        default=lambda: {"sql": 50, "problem_solving": 50, "debugging": 50},
        nullable=False,
    )

    evidence_records: Mapped[list] = mapped_column(
        SafeJSON,
        default=list,
        nullable=False,
    )  # Historical evidence entries from battles and assessments

    placement_readiness_score: Mapped[float] = mapped_column(
        Float,
        default=50.0,
        nullable=False,
    )

    confidence_level: Mapped[str] = mapped_column(
        String(20),
        default="Medium",
        nullable=False,
    )  # Low, Medium, High

    weak_areas: Mapped[list] = mapped_column(
        SafeJSON,
        default=list,
        nullable=False,
    )

    recommended_actions: Mapped[list] = mapped_column(
        SafeJSON,
        default=list,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
