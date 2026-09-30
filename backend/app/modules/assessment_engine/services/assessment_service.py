"""
=========================================================
SkillBattle V3 — Unified Assessment Service
=========================================================
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import random

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_

from app.models.assessment_engine import (
    UnifiedAssessment,
    AssessmentAttempt,
    AssessmentQuestionSubmission,
)
from app.models.question import Question
from app.modules.assessment_engine.services.scoring_service import scoring_engine
from app.modules.assessment_engine.services.sandbox_runner import sandbox_runner
from app.modules.assessment_engine.services.skill_evaluation_service import skill_engine

logger = logging.getLogger(__name__)


class AssessmentService:
    @staticmethod
    async def create_assessment(
        db: AsyncSession,
        assessment_data: Dict[str, Any],
        creator_user_id: str,
    ) -> UnifiedAssessment:
        """Create a new unified assessment."""
        assessment = UnifiedAssessment(
            title=assessment_data.get("title", "Skill Assessment"),
            description=assessment_data.get("description", ""),
            assessment_type=assessment_data.get("assessment_type", "GENERAL"),
            difficulty=assessment_data.get("difficulty", "MEDIUM"),
            duration_minutes=assessment_data.get("duration_minutes", 60),
            total_questions=assessment_data.get("total_questions", 10),
            passing_score=assessment_data.get("passing_score", 60.0),
            negative_marking=assessment_data.get("negative_marking", False),
            randomize_questions=assessment_data.get("randomize_questions", True),
            sections_json=assessment_data.get("sections_json", []),
            scoring_rules=assessment_data.get("scoring_rules", {
                "mcq_weight": 0.2,
                "coding_weight": 0.5,
                "debugging_weight": 0.15,
                "sql_weight": 0.15,
            }),
            allowed_languages=assessment_data.get("allowed_languages", ["python", "javascript", "cpp", "java", "sql"]),
            attempt_limit=assessment_data.get("attempt_limit", 1),
            start_time=assessment_data.get("start_time"),
            end_time=assessment_data.get("end_time"),
            is_public=assessment_data.get("is_public", True),
            college_id=assessment_data.get("college_id"),
            company_id=assessment_data.get("company_id"),
            created_by_user_id=creator_user_id,
        )
        db.add(assessment)
        await db.commit()
        await db.refresh(assessment)
        return assessment

    @staticmethod
    async def list_assessments(
        db: AsyncSession,
        user_role: Optional[str] = None,
        college_id: Optional[int] = None,
        company_id: Optional[str] = None,
        assessment_type: Optional[str] = None,
    ) -> List[UnifiedAssessment]:
        """List assessments based on visibility and optional filters."""
        stmt = select(UnifiedAssessment)

        conditions = []
        if assessment_type:
            conditions.append(UnifiedAssessment.assessment_type == assessment_type)

        if college_id is not None:
            conditions.append(UnifiedAssessment.college_id == college_id)
        elif company_id is not None:
            conditions.append(UnifiedAssessment.company_id == company_id)
        else:
            conditions.append(UnifiedAssessment.is_public == True)

        if conditions:
            stmt = stmt.where(and_(*conditions))

        stmt = stmt.order_by(UnifiedAssessment.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_assessment(db: AsyncSession, assessment_id: str) -> Optional[UnifiedAssessment]:
        """Fetch an assessment by ID."""
        stmt = select(UnifiedAssessment).where(UnifiedAssessment.id == assessment_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def start_attempt(
        db: AsyncSession,
        assessment_id: str,
        user_id: str,
    ) -> AssessmentAttempt:
        """Start or resume an assessment attempt with a server-authoritative timer."""
        assessment = await AssessmentService.get_assessment(db, assessment_id)
        if not assessment:
            raise ValueError("Assessment not found")

        # Check existing attempts
        stmt = select(AssessmentAttempt).where(
            AssessmentAttempt.assessment_id == assessment_id,
            AssessmentAttempt.user_id == user_id,
        )
        result = await db.execute(stmt)
        existing_attempts = list(result.scalars().all())

        # Check active attempt
        for att in existing_attempts:
            if att.status == "IN_PROGRESS":
                if datetime.utcnow() > att.end_time:
                    att.status = "EXPIRED"
                    await db.commit()
                else:
                    return att

        completed_count = sum(1 for att in existing_attempts if att.status in ["COMPLETED", "SUBMITTED", "EVALUATING"])
        if completed_count >= assessment.attempt_limit:
            raise ValueError(f"Maximum attempt limit ({assessment.attempt_limit}) reached for this assessment")

        # Select questions
        q_stmt = select(Question).where(Question.is_active == True)
        q_result = await db.execute(q_stmt)
        all_questions = list(q_result.scalars().all())

        if assessment.randomize_questions:
            random.shuffle(all_questions)

        selected_questions = all_questions[: assessment.total_questions]
        question_sequence = [q.id for q in selected_questions]

        now = datetime.utcnow()
        end_time = now + timedelta(minutes=assessment.duration_minutes)

        attempt = AssessmentAttempt(
            assessment_id=assessment_id,
            user_id=user_id,
            status="IN_PROGRESS",
            start_time=now,
            end_time=end_time,
            current_question_index=0,
            answers_json={},
            question_sequence=question_sequence,
            max_possible_score=float(len(question_sequence) * 10),
        )

        db.add(attempt)
        await db.commit()
        await db.refresh(attempt)
        return attempt

    @staticmethod
    async def get_attempt(
        db: AsyncSession,
        attempt_id: str,
        user_id: str,
    ) -> Optional[AssessmentAttempt]:
        """Retrieve an assessment attempt and update timer expiration status if needed."""
        stmt = select(AssessmentAttempt).where(
            AssessmentAttempt.id == attempt_id,
            AssessmentAttempt.user_id == user_id,
        )
        result = await db.execute(stmt)
        attempt = result.scalar_one_or_none()

        if attempt and attempt.status == "IN_PROGRESS":
            if datetime.utcnow() > attempt.end_time:
                attempt.status = "EXPIRED"
                await db.commit()
                await db.refresh(attempt)

        return attempt

    @staticmethod
    async def record_answer(
        db: AsyncSession,
        attempt_id: str,
        user_id: str,
        question_id: int,
        answer: str,
        language: str = "python",
    ) -> AssessmentAttempt:
        """Record an answer for a specific question in an active attempt session."""
        attempt = await AssessmentService.get_attempt(db, attempt_id, user_id)
        if not attempt:
            raise ValueError("Attempt not found")

        if attempt.status != "IN_PROGRESS":
            raise ValueError(f"Cannot update answer for attempt with status '{attempt.status}'")

        answers = dict(attempt.answers_json or {})
        answers[str(question_id)] = {
            "answer": answer,
            "language": language,
            "updated_at": datetime.utcnow().isoformat(),
        }

        attempt.answers_json = answers
        await db.commit()
        await db.refresh(attempt)
        return attempt

    @staticmethod
    async def record_integrity_event(
        db: AsyncSession,
        attempt_id: str,
        user_id: str,
        event_type: str,
    ) -> AssessmentAttempt:
        """Log integrity signals (e.g. tab switches, copy-paste) during assessment."""
        attempt = await AssessmentService.get_attempt(db, attempt_id, user_id)
        if not attempt:
            raise ValueError("Attempt not found")

        signals = dict(attempt.integrity_signals or {})
        if event_type == "tab_switch":
            signals["tab_switch_count"] = signals.get("tab_switch_count", 0) + 1
        elif event_type == "copy_paste":
            signals["copy_paste_count"] = signals.get("copy_paste_count", 0) + 1
        elif event_type == "rapid_answer":
            signals["rapid_answers"] = signals.get("rapid_answers", 0) + 1
        elif event_type == "session_reconnect":
            signals["session_reconnects"] = signals.get("session_reconnects", 0) + 1

        attempt.integrity_signals = signals
        await db.commit()
        await db.refresh(attempt)
        return attempt

    @staticmethod
    async def submit_attempt(
        db: AsyncSession,
        attempt_id: str,
        user_id: str,
        answers_payload: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Submit and evaluate an assessment attempt."""
        attempt = await AssessmentService.get_attempt(db, attempt_id, user_id)
        if not attempt:
            raise ValueError("Attempt not found")

        if attempt.status in ["COMPLETED", "SUBMITTED"]:
            # Already evaluated
            return {
                "attempt_id": attempt.id,
                "score": attempt.score,
                "max_possible_score": attempt.max_possible_score,
                "percentage": attempt.percentage,
                "is_passed": attempt.is_passed,
                "status": attempt.status,
                "evaluation_summary": attempt.evaluation_summary,
            }

        attempt.status = "EVALUATING"
        attempt.submitted_at = datetime.utcnow()

        if answers_payload:
            current_answers = dict(attempt.answers_json or {})
            current_answers.update(answers_payload)
            attempt.answers_json = current_answers

        answers_map = attempt.answers_json or {}
        question_ids = attempt.question_sequence or []

        # Fetch questions from DB
        q_stmt = select(Question).where(Question.id.in_(question_ids))
        q_result = await db.execute(q_stmt)
        questions_by_id = {q.id: q for q in q_result.scalars().all()}

        assessment = await AssessmentService.get_assessment(db, attempt.assessment_id)
        neg_marking = assessment.negative_marking if assessment else False

        submissions_eval = []
        question_submission_objs = []

        for q_id in question_ids:
            question = questions_by_id.get(q_id)
            if not question:
                continue

            ans_entry = answers_map.get(str(q_id), {})
            submitted_val = ans_entry.get("answer", "") if isinstance(ans_entry, dict) else str(ans_entry)
            lang = ans_entry.get("language", "python") if isinstance(ans_entry, dict) else "python"

            q_type = (question.question_type or "CODING").upper()
            score_awarded = 0.0
            max_score = 10.0
            passed_tc = 0
            total_tc = len(question.hidden_test_cases or [])
            exec_status = "ACCEPTED"
            err_output = ""
            exec_time = 0

            if q_type in ["MCQ", "SINGLE_CHOICE"]:
                neg_marks = 2.5 if neg_marking else 0.0
                score_awarded, is_corr, msg = scoring_engine.evaluate_mcq(
                    submitted_choice=submitted_val,
                    correct_option=question.correct_option,
                    max_marks=max_score,
                    negative_marks=neg_marks,
                )
                exec_status = "ACCEPTED" if is_corr else "WRONG_ANSWER"

            elif q_type == "MULTIPLE_SELECT":
                neg_marks = 2.5 if neg_marking else 0.0
                submitted_list = submitted_val if isinstance(submitted_val, list) else [submitted_val]
                corr_list = question.correct_option if isinstance(question.correct_option, list) else [question.correct_option]
                score_awarded, is_corr, msg = scoring_engine.evaluate_multiple_select(
                    submitted_choices=submitted_list,
                    correct_options=corr_list,
                    max_marks=max_score,
                    negative_marks=neg_marks,
                )
                exec_status = "ACCEPTED" if is_corr else "WRONG_ANSWER"

            else:
                # CODING / DEBUGGING / TECHNICAL
                run_res = sandbox_runner.run_code(
                    code=submitted_val,
                    language=lang,
                    test_cases=question.hidden_test_cases or [],
                )
                passed_tc = run_res["passed_count"]
                total_tc = run_res["total_count"]
                exec_status = run_res["execution_status"]
                err_output = run_res["error_output"]
                exec_time = run_res["execution_time_ms"]

                score_awarded, is_corr, msg = scoring_engine.evaluate_coding_test_cases(
                    passed_count=passed_tc,
                    total_count=total_tc,
                    max_marks=max_score,
                    execution_status=exec_status,
                )

            q_sub_record = AssessmentQuestionSubmission(
                attempt_id=attempt.id,
                assessment_id=attempt.assessment_id,
                question_id=question.id,
                user_id=user_id,
                question_type=q_type,
                submitted_answer=str(submitted_val),
                language=lang,
                execution_status=exec_status,
                score_awarded=score_awarded,
                max_score=max_score,
                passed_test_cases=passed_tc,
                total_test_cases=total_tc,
                execution_time_ms=exec_time,
                error_output=err_output,
            )
            db.add(q_sub_record)
            question_submission_objs.append(q_sub_record)

            submissions_eval.append({
                "question_id": question.id,
                "question_title": question.title,
                "question_type": q_type,
                "score_awarded": score_awarded,
                "max_score": max_score,
                "execution_status": exec_status,
                "passed_test_cases": passed_tc,
                "total_test_cases": total_tc,
            })

        # Compute totals
        summary = scoring_engine.compute_assessment_total(
            question_submissions=submissions_eval,
            sections=assessment.sections_json if assessment else [],
            scoring_rules=assessment.scoring_rules if assessment else {},
            passing_score_percentage=assessment.passing_score if assessment else 60.0,
        )

        attempt.score = summary["total_score"]
        attempt.max_possible_score = summary["max_possible_score"]
        attempt.percentage = summary["percentage"]
        attempt.is_passed = summary["is_passed"]
        attempt.status = "COMPLETED"
        attempt.evaluation_summary = {
            "summary": summary,
            "submissions": submissions_eval,
            "integrity_signals": attempt.integrity_signals,
        }

        # Update evidence-based student skill profile
        await skill_engine.update_skill_from_attempt(
            db=db,
            user_id=user_id,
            attempt=attempt,
            question_submissions=question_submission_objs,
        )

        await db.commit()
        await db.refresh(attempt)

        return {
            "attempt_id": attempt.id,
            "assessment_id": attempt.assessment_id,
            "score": attempt.score,
            "max_possible_score": attempt.max_possible_score,
            "percentage": attempt.percentage,
            "is_passed": attempt.is_passed,
            "status": attempt.status,
            "evaluation_summary": attempt.evaluation_summary,
        }


assessment_service = AssessmentService()
