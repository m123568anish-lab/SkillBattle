"""
=========================================================
SkillBattle V3 — Unified Assessment & Skill API Router
=========================================================
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from sqlalchemy import select

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.assessment_engine import AssessmentQuestionSubmission
from app.models.battle import BattleSubmission
from app.models.question import Question, UserSubmission
from app.models.user import User
from app.modules.assessment_engine.services.assessment_service import assessment_service
from app.modules.assessment_engine.services.skill_evaluation_service import skill_engine
from app.modules.skill_intelligence.service import normalize_skill_id, skill_intelligence_service

router = APIRouter(
    prefix="/assessments",
    tags=["V3 Unified Assessment & Skill Intelligence Engine"],
)


# ==========================================
# Pydantic Schemas
# ==========================================

class AssessmentCreateRequest(BaseModel):
    title: str = Field(..., example="Full Stack Hiring Assessment")
    description: Optional[str] = Field("", example="Comprehensive coding and CS fundamentals test")
    assessment_type: str = Field("GENERAL", example="COMPANY") # GENERAL, PRACTICE, PLACEMENT, COMPANY, COLLEGE, TOURNAMENT, MOCK_INTERVIEW, SKILL_TEST
    difficulty: str = Field("MEDIUM", example="HARD")
    duration_minutes: int = Field(60, ge=5, le=360)
    total_questions: int = Field(10, ge=1, le=100)
    passing_score: float = Field(60.0, ge=0.0, le=100.0)
    negative_marking: bool = False
    randomize_questions: bool = True
    sections_json: List[Dict[str, Any]] = []
    scoring_rules: Dict[str, Any] = {
        "mcq_weight": 0.2,
        "coding_weight": 0.5,
        "debugging_weight": 0.15,
        "sql_weight": 0.15,
    }
    allowed_languages: List[str] = ["python", "javascript", "cpp", "java", "sql"]
    attempt_limit: int = Field(1, ge=1)
    is_public: bool = True
    college_id: Optional[int] = None
    company_id: Optional[str] = None


class AnswerRecordRequest(BaseModel):
    question_id: int
    answer: Any
    language: str = "python"


class IntegrityEventRequest(BaseModel):
    event_type: str = Field(..., example="tab_switch") # tab_switch, copy_paste, rapid_answer, session_reconnect


class AttemptSubmitRequest(BaseModel):
    answers_payload: Optional[Dict[str, Any]] = None


# ==========================================
# Assessment Router Endpoints
# ==========================================

@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_assessment(
    payload: AssessmentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new unified assessment configuration."""
    assessment = await assessment_service.create_assessment(
        db=db,
        assessment_data=payload.model_dump(),
        creator_user_id=current_user.id,
    )
    return assessment


@router.get("")
async def list_assessments(
    assessment_type: Optional[str] = Query(None, alias="type"),
    college_id: Optional[int] = Query(None),
    company_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List available assessments matching optional filters."""
    assessments = await assessment_service.list_assessments(
        db=db,
        user_role=current_user.role,
        college_id=college_id,
        company_id=company_id,
        assessment_type=assessment_type,
    )
    return {"assessments": assessments}


@router.get("/{assessment_id}")
async def get_assessment_detail(
    assessment_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Fetch details of a specific assessment."""
    assessment = await assessment_service.get_assessment(db=db, assessment_id=assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment


@router.post("/{assessment_id}/start")
async def start_assessment_attempt(
    assessment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Start or resume an assessment session with a server-authoritative timer."""
    try:
        attempt = await assessment_service.start_attempt(
            db=db,
            assessment_id=assessment_id,
            user_id=current_user.id,
        )
        return {
            "attempt_id": attempt.id,
            "assessment_id": attempt.assessment_id,
            "status": attempt.status,
            "start_time": attempt.start_time,
            "end_time": attempt.end_time,
            "question_sequence": attempt.question_sequence,
            "current_question_index": attempt.current_question_index,
            "answers": attempt.answers_json,
        }
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))


@router.get("/attempt/{attempt_id}")
async def get_attempt_status(
    attempt_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get attempt progress and remaining time."""
    attempt = await assessment_service.get_attempt(
        db=db,
        attempt_id=attempt_id,
        user_id=current_user.id,
    )
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt session not found")
    return attempt


@router.post("/attempt/{attempt_id}/answer")
async def record_answer(
    attempt_id: str,
    payload: AnswerRecordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Record or update user answer during active session."""
    try:
        attempt = await assessment_service.record_answer(
            db=db,
            attempt_id=attempt_id,
            user_id=current_user.id,
            question_id=payload.question_id,
            answer=payload.answer,
            language=payload.language,
        )
        return {"status": "success", "attempt_id": attempt.id}
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))


@router.post("/attempt/{attempt_id}/integrity")
async def record_integrity_signal(
    attempt_id: str,
    payload: IntegrityEventRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Log anti-cheat / proctoring integrity signal."""
    try:
        attempt = await assessment_service.record_integrity_event(
            db=db,
            attempt_id=attempt_id,
            user_id=current_user.id,
            event_type=payload.event_type,
        )
        return {"status": "signal_recorded", "signals": attempt.integrity_signals}
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))


@router.post("/attempt/{attempt_id}/submit")
async def submit_assessment_attempt(
    attempt_id: str,
    payload: Optional[AttemptSubmitRequest] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit attempt for automated execution & scoring."""
    try:
        answers = payload.answers_payload if payload else None
        result = await assessment_service.submit_attempt(
            db=db,
            attempt_id=attempt_id,
            user_id=current_user.id,
            answers_payload=answers,
        )
        return result
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))


# ==========================================
# Skill & Placement Intelligence Endpoints
# ==========================================

skills_router = APIRouter(
    prefix="/skills",
    tags=["Skill Intelligence & Placement Readiness"],
)


async def _collect_canonical_skill_evidence(db: AsyncSession, user_id: str) -> list[dict[str, Any]]:
    evidence: list[dict[str, Any]] = []

    practice_stmt = (
        select(UserSubmission, Question)
        .join(Question, Question.id == UserSubmission.question_id)
        .where(UserSubmission.user_id == user_id)
    )
    for submission, question in (await db.execute(practice_stmt)).all():
        evidence.append({
            "user_id": user_id,
            "skill_id": normalize_skill_id(question.skill_category if question else "Problem Solving"),
            "source_type": "PRACTICE",
            "source_id": f"practice:{submission.id}",
            "submission_id": str(submission.id),
            "question_id": str(submission.question_id),
            "difficulty": (question.difficulty if question else "medium").lower(),
            "correct": bool(submission.solved),
            "score": 1.0 if submission.solved else 0.0,
            "max_score": 1.0,
            "response_time_ms": submission.execution_time_ms,
            "attempt_number": 1,
            "timestamp": submission.created_at.isoformat(),
        })

    battle_stmt = (
        select(BattleSubmission, Question)
        .outerjoin(Question, Question.id == BattleSubmission.question_id)
        .where(BattleSubmission.user_id == user_id)
    )
    for submission, question in (await db.execute(battle_stmt)).all():
        total_tests = submission.total_tests or 1
        score_ratio = round((submission.passed_tests / total_tests) if total_tests else 1.0, 4)
        correct = bool(submission.accepted or score_ratio >= 0.5)
        evidence.append({
            "user_id": user_id,
            "skill_id": normalize_skill_id(question.skill_category if question else submission.question_type),
            "source_type": "BATTLE",
            "source_id": f"battle:{submission.id}",
            "submission_id": str(submission.id),
            "question_id": str(submission.question_id or submission.id),
            "difficulty": "medium",
            "correct": correct,
            "score": score_ratio,
            "max_score": 1.0,
            "response_time_ms": int(submission.time_taken_seconds * 1000),
            "attempt_number": 1,
            "timestamp": submission.submitted_at.isoformat(),
        })

    assessment_stmt = (
        select(AssessmentQuestionSubmission, Question)
        .join(Question, Question.id == AssessmentQuestionSubmission.question_id)
        .where(AssessmentQuestionSubmission.user_id == user_id)
    )
    for submission, question in (await db.execute(assessment_stmt)).all():
        evidence.append({
            "user_id": user_id,
            "skill_id": normalize_skill_id(question.skill_category if question else "Problem Solving"),
            "source_type": "ASSESSMENT",
            "source_id": f"assessment:{submission.attempt_id}",
            "submission_id": str(submission.id),
            "question_id": str(submission.question_id),
            "difficulty": (question.difficulty if question else "medium").lower(),
            "correct": submission.score_awarded >= (submission.max_score * 0.5),
            "score": submission.score_awarded / submission.max_score if submission.max_score else 1.0,
            "max_score": 1.0,
            "response_time_ms": submission.execution_time_ms,
            "attempt_number": 1,
            "timestamp": submission.created_at.isoformat(),
        })

    return skill_intelligence_service.dedupe_records([skill_intelligence_service.normalize_evidence(item) for item in evidence])


@skills_router.get("/profile")
async def get_student_skill_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve evidence-based skill scores across the canonical taxonomy."""
    evidence = await _collect_canonical_skill_evidence(db, current_user.id)
    profile = skill_intelligence_service.build_profile(evidence)
    compatibility = []
    for skill in profile["skills"]:
        compatibility.append({
            "skill": skill["skill_name"],
            "score": skill["score"],
            "attempts": skill["evidence_count"],
            "verified": True,
            "sources": ["battle", "practice", "assessment"],
        })
    return {
        "skills": compatibility,
        "gaps": profile["gaps"],
        "placement_readiness": profile["placement_readiness"],
        "next_best_action": profile["next_best_action"],
    }


@skills_router.get("/gaps")
async def get_skill_gaps(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    evidence = await _collect_canonical_skill_evidence(db, current_user.id)
    profile = skill_intelligence_service.build_profile(evidence)
    return {"gaps": profile["gaps"], "next_best_action": profile["next_best_action"]}


@skills_router.get("/placement-readiness")
async def get_placement_readiness(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve evidence-driven placement readiness and the canonical readiness matrix."""
    evidence = await _collect_canonical_skill_evidence(db, current_user.id)
    profile = skill_intelligence_service.build_profile(evidence)
    return {
        "user_id": current_user.id,
        "state": profile["placement_readiness"]["state"],
        "confidence": profile["placement_readiness"]["confidence"],
        "matrix": profile["placement_readiness"]["matrix"],
        "next_best_action": profile["next_best_action"],
    }
