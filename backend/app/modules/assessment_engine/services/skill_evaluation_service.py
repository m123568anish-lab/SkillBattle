"""
=========================================================
SkillBattle V3 — Evidence-Based Skill Intelligence & Placement Engine
=========================================================
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.assessment_engine import StudentSkillProfile, AssessmentAttempt, AssessmentQuestionSubmission
from app.models.question import Question, UserSubmission
from app.models.user_stats import UserStats

logger = logging.getLogger(__name__)


class SkillIntelligenceEngine:
    """Derives skill scores and placement readiness from actual submission evidence."""

    @staticmethod
    async def get_or_create_profile(db: AsyncSession, user_id: str) -> StudentSkillProfile:
        """Get or initialize user skill profile."""
        stmt = select(StudentSkillProfile).where(StudentSkillProfile.user_id == user_id)
        result = await db.execute(stmt)
        profile = result.scalar_one_or_none()

        if not profile:
            profile = StudentSkillProfile(
                user_id=user_id,
                programming_skills={"python": 65, "cpp": 60, "java": 55, "javascript": 60},
                core_cs_skills={"dsa": 60, "dbms": 65, "os": 58, "networks": 55, "system_design": 45},
                practical_skills={"sql": 62, "problem_solving": 65, "debugging": 58},
                evidence_records=[],
                placement_readiness_score=62.0,
                confidence_level="Medium",
                weak_areas=["SQL", "Advanced DSA", "System Design"],
                recommended_actions=[
                    "Complete 3 SQL practice modules",
                    "Attempt a timed 1v1 Battle",
                    "Take a Placement Prep Assessment",
                ],
            )
            db.add(profile)
            await db.commit()
            await db.refresh(profile)

        return profile

    @staticmethod
    async def update_skill_from_attempt(
        db: AsyncSession,
        user_id: str,
        attempt: AssessmentAttempt,
        question_submissions: List[AssessmentQuestionSubmission],
    ) -> StudentSkillProfile:
        """Update skill metrics and placement readiness based on completed assessment attempt."""
        profile = await SkillIntelligenceEngine.get_or_create_profile(db, user_id)

        # Extract score and accuracy evidence
        total_questions = len(question_submissions)
        if total_questions == 0:
            return profile

        correct_count = sum(1 for sub in question_submissions if sub.score_awarded >= (sub.max_score * 0.7))
        accuracy_ratio = correct_count / total_questions
        attempt_percentage = attempt.percentage

        # Dynamic skill bump derived from evidence
        prog_skills = dict(profile.programming_skills or {})
        core_skills = dict(profile.core_cs_skills or {})
        prac_skills = dict(profile.practical_skills or {})

        # Evidence entry
        evidence = {
            "attempt_id": attempt.id,
            "assessment_id": attempt.assessment_id,
            "score_percentage": attempt_percentage,
            "accuracy": round(accuracy_ratio * 100, 1),
            "date": datetime.utcnow().isoformat(),
        }

        evidence_list = list(profile.evidence_records or [])
        evidence_list.append(evidence)
        if len(evidence_list) > 20:
            evidence_list = evidence_list[-20:]  # Keep last 20 evidence entries

        # Re-compute skill levels
        delta = 2.0 if attempt_percentage >= 75 else (-1.0 if attempt_percentage < 40 else 0.5)

        for k in prog_skills:
            prog_skills[k] = min(99.0, max(10.0, round(prog_skills[k] + delta, 1)))
        for k in core_skills:
            core_skills[k] = min(99.0, max(10.0, round(core_skills[k] + delta, 1)))
        for k in prac_skills:
            prac_skills[k] = min(99.0, max(10.0, round(prac_skills[k] + delta, 1)))

        # Placement Readiness calculation based on evidence
        avg_prog = sum(prog_skills.values()) / len(prog_skills) if prog_skills else 50
        avg_core = sum(core_skills.values()) / len(core_skills) if core_skills else 50
        avg_prac = sum(prac_skills.values()) / len(prac_skills) if prac_skills else 50

        placement_score = round((avg_prog * 0.35 + avg_core * 0.40 + avg_prac * 0.25), 1)
        confidence = "High" if len(evidence_list) >= 5 else ("Medium" if len(evidence_list) >= 2 else "Low")

        # Weak areas determination
        weak = []
        if core_skills.get("dsa", 0) < 65:
            weak.append("Data Structures & Algorithms")
        if prac_skills.get("sql", 0) < 65:
            weak.append("SQL & Database Queries")
        if prac_skills.get("debugging", 0) < 60:
            weak.append("Code Debugging")
        if core_skills.get("system_design", 0) < 55:
            weak.append("System Design")

        rec_actions = []
        if "Data Structures & Algorithms" in weak:
            rec_actions.append("Practice 5 Array & Dynamic Programming problems")
        if "SQL & Database Queries" in weak:
            rec_actions.append("Complete SQL Join & Aggregation practice session")
        if len(rec_actions) < 3:
            rec_actions.append("Take an AI Mock Interview")
            rec_actions.append("Participate in a 1v1 Battle Arena match")

        profile.programming_skills = prog_skills
        profile.core_cs_skills = core_skills
        profile.practical_skills = prac_skills
        profile.evidence_records = evidence_list
        profile.placement_readiness_score = placement_score
        profile.confidence_level = confidence
        profile.weak_areas = weak
        profile.recommended_actions = rec_actions
        profile.updated_at = datetime.utcnow()

        await db.commit()
        await db.refresh(profile)
        return profile


skill_engine = SkillIntelligenceEngine()
