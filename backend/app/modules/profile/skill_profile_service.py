from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.achievement import Achievement
from app.models.battle import BattleRoom, BattleSubmission
from app.models.college import CollegeAssessment, CollegeAssessmentSubmission
from app.models.interview import InterviewSession
from app.models.question import Question, UserSubmission
from app.models.user import User


class SkillProfileService:
    """Build verified profile evidence exclusively from persisted platform results."""

    async def get_profile(self, db: AsyncSession, user: User) -> dict[str, Any]:
        aggregates: dict[str, dict[str, Any]] = defaultdict(
            lambda: {"correct": 0.0, "attempts": 0, "sources": set()}
        )
        practice: list[dict[str, Any]] = []
        battles: list[dict[str, Any]] = []
        assessments: list[dict[str, Any]] = []
        interviews: list[dict[str, Any]] = []

        def record_skill(skill: str, score: float, source: str) -> None:
            name = (skill or "General").strip() or "General"
            aggregate = aggregates[name]
            aggregate["correct"] += min(100.0, max(0.0, score))
            aggregate["attempts"] += 1
            aggregate["sources"].add(source)

        practice_stmt = (
            select(UserSubmission, Question)
            .join(Question, Question.id == UserSubmission.question_id)
            .where(UserSubmission.user_id == user.id)
            .order_by(UserSubmission.created_at.desc())
        )
        for submission, question in (await db.execute(practice_stmt)).all():
            score = 100.0 if submission.solved else 0.0
            skill = question.skill_category or "General"
            record_skill(skill, score, "practice")
            practice.append(
                {
                    "source": "practice",
                    "title": question.title,
                    "score": score,
                    "completed_at": submission.created_at.isoformat(),
                }
            )

        battle_stmt = (
            select(BattleSubmission, BattleRoom, Question)
            .join(BattleRoom, BattleRoom.id == BattleSubmission.battle_id)
            .outerjoin(Question, Question.id == BattleSubmission.question_id)
            .where(
                BattleSubmission.user_id == user.id,
                func.lower(BattleRoom.status).in_(("completed", "finished", "finalized")),
            )
            .order_by(BattleSubmission.submitted_at.desc())
        )
        battle_rows = (await db.execute(battle_stmt)).all()
        by_battle: dict[str, list[BattleSubmission]] = defaultdict(list)
        battle_titles: dict[str, str] = {}
        for submission, battle, question in battle_rows:
            if submission.total_tests > 0:
                score = round(submission.passed_tests / submission.total_tests * 100.0, 1)
            else:
                score = 100.0 if submission.verdict in {"Accepted", "Correct"} else 0.0
            skill = question.skill_category if question else submission.question_type.title()
            record_skill(skill, score, "battle")
            by_battle[battle.id].append(submission)
            battle_titles[battle.id] = battle.title

        for battle_id, submissions in by_battle.items():
            scores = [
                (submission.passed_tests / submission.total_tests * 100.0)
                if submission.total_tests > 0
                else (100.0 if submission.verdict in {"Accepted", "Correct"} else 0.0)
                for submission in submissions
            ]
            battles.append(
                {
                    "source": "battle",
                    "title": battle_titles[battle_id],
                    "score": round(sum(scores) / len(scores), 1),
                    "completed_at": max(s.submitted_at for s in submissions).isoformat(),
                }
            )

        college_stmt = (
            select(CollegeAssessmentSubmission)
            .options(
                selectinload(CollegeAssessmentSubmission.assessment).selectinload(CollegeAssessment.questions)
            )
            .where(
                CollegeAssessmentSubmission.student_id == user.id,
                CollegeAssessmentSubmission.status.in_(("SUBMITTED", "EVALUATED")),
            )
            .order_by(CollegeAssessmentSubmission.submitted_at.desc())
        )
        for submission in (await db.execute(college_stmt)).scalars().all():
            assessment = submission.assessment
            assessments.append(
                {
                    "source": "college_assessment",
                    "title": assessment.title,
                    "score": float(submission.percentage),
                    "completed_at": submission.submitted_at.isoformat(),
                }
            )
            answers = submission.answers_json or {}
            for question in assessment.questions:
                if question.question_type.upper() != "MCQ":
                    continue
                answer = answers.get(str(question.id), answers.get(f"q_{question.id}"))
                if answer is None:
                    continue
                score = (
                    100.0
                    if str(answer).strip().casefold() == str(question.correct_option).strip().casefold()
                    else 0.0
                )
                record_skill(question.skill_category, score, "college_assessment")

        interview_stmt = (
            select(InterviewSession)
            .where(
                InterviewSession.user_id == user.id,
                func.lower(InterviewSession.status) == "completed",
                InterviewSession.finished_at.is_not(None),
            )
            .order_by(InterviewSession.finished_at.desc())
        )
        for interview in (await db.execute(interview_stmt)).scalars().all():
            interviews.append(
                {
                    "source": "interview",
                    "title": f"{interview.role} interview",
                    "score": float(interview.overall_score or 0),
                    "completed_at": interview.finished_at.isoformat(),
                }
            )

        achievement_stmt = (
            select(Achievement)
            .where(Achievement.user_id == user.id, Achievement.unlocked.is_(True))
            .order_by(Achievement.earned_at.desc())
        )
        achievements = [
            {
                "title": achievement.title,
                "description": achievement.description or "",
                "earned_at": achievement.earned_at.isoformat() if achievement.earned_at else None,
            }
            for achievement in (await db.execute(achievement_stmt)).scalars().all()
        ]

        skills = [
            {
                "skill": skill,
                "score": round(values["correct"] / values["attempts"], 1),
                "attempts": values["attempts"],
                "sources": sorted(values["sources"]),
                "verified": True,
            }
            for skill, values in aggregates.items()
        ]
        skills.sort(key=lambda item: (-item["score"], item["skill"].casefold()))

        return {
            "skills": skills,
            "practice_performance": practice[:50],
            "battle_performance": battles[:50],
            "assessment_performance": assessments[:50],
            "interview_results": interviews[:50],
            "achievements": achievements[:50],
        }


skill_profile_service = SkillProfileService()