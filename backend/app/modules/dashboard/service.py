"""
=========================================================

SkillBattle

Dashboard Service

=========================================================
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.user import User
from app.models.user_stats import UserStats
from app.models.user_skill_stat import UserSkillStat
from app.modules.student_command_center.service import student_command_center_service
from app.modules.skill_intelligence.service import skill_intelligence_service
from app.modules.profile.service import profile_service
from app.modules.roadmap.service import roadmap_service
from app.modules.xp.service import xp_service

from app.modules.dashboard.repository import (
    dashboard_repository,
)

from app.modules.dashboard.schemas import (
    DashboardResponse,
    UserSummary,
    DashboardStats,
    WeeklyActivity,
    Achievement,
    AIRecommendation,
    DailyChallenge,
)


class DashboardService:

    async def get_command_center(self, db: AsyncSession, current_user: User) -> dict:
        user_id = str(current_user.id)
        profile = await profile_service.get_profile(db, current_user)
        study_hours_value = None
        if getattr(profile, "onboarding_preferences", None):
            study_hours_value = profile.onboarding_preferences.get("study_hours")
        if study_hours_value is None and getattr(profile, "target_package", None):
            study_hours_value = profile.target_package
        try:
            study_hours = int(study_hours_value) if study_hours_value not in (None, "") else None
        except (TypeError, ValueError):
            study_hours = None

        user_xp = await xp_service.get_user_xp(db, current_user)
        total_xp = int(getattr(user_xp, "total_xp", 0) or 0)
        current_streak = await dashboard_repository.get_current_streak(db, user_id)
        roadmap = roadmap_service.get_roadmap(db, current_user)
        roadmap_summary = None
        if roadmap is not None:
            roadmap_summary = {
                "title": roadmap.title,
                "progress": int(getattr(roadmap, "progress", 0) or 0),
                "milestone": (roadmap.weeks[0].title if roadmap.weeks else "Roadmap active"),
            }

        # Collect real evidence from the canonical skill intelligence system.
        evidence = []
        from sqlalchemy import select
        from app.models.question import Question
        from app.models.assessment_engine import AssessmentQuestionSubmission
        from app.models.battle.battle_submission import BattleSubmission
        from app.models.user_submission import UserSubmission

        practice_stmt = select(UserSubmission, Question).join(Question, Question.id == UserSubmission.question_id).where(UserSubmission.user_id == user_id)
        for submission, question in (await db.execute(practice_stmt)).all():
            evidence.append({
                "user_id": user_id,
                "skill_id": question.skill_category if question else "Problem Solving",
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

        battle_stmt = select(BattleSubmission, Question).outerjoin(Question, Question.id == BattleSubmission.question_id).where(BattleSubmission.user_id == user_id)
        for submission, question in (await db.execute(battle_stmt)).all():
            total_tests = submission.total_tests or 1
            score_ratio = round((submission.passed_tests / total_tests) if total_tests else 1.0, 4)
            evidence.append({
                "user_id": user_id,
                "skill_id": question.skill_category if question else str(submission.question_type or "Problem Solving"),
                "source_type": "BATTLE",
                "source_id": f"battle:{submission.id}",
                "submission_id": str(submission.id),
                "question_id": str(submission.question_id or submission.id),
                "difficulty": "medium",
                "correct": bool(submission.accepted or score_ratio >= 0.5),
                "score": score_ratio,
                "max_score": 1.0,
                "response_time_ms": int((submission.time_taken_seconds or 0) * 1000),
                "attempt_number": 1,
                "timestamp": submission.submitted_at.isoformat(),
            })

        assessment_stmt = select(AssessmentQuestionSubmission, Question).join(Question, Question.id == AssessmentQuestionSubmission.question_id).where(AssessmentQuestionSubmission.user_id == user_id)
        for submission, question in (await db.execute(assessment_stmt)).all():
            evidence.append({
                "user_id": user_id,
                "skill_id": question.skill_category if question else "Problem Solving",
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

        skill_profile = skill_intelligence_service.build_profile(evidence)
        return student_command_center_service.build_command_center(
            skill_profile=skill_profile,
            xp=int(total_xp),
            streak=int(current_streak or 0),
            target_company=(getattr(profile, "target_company", None) or "") or "",
            study_hours=study_hours,
            roadmap=roadmap_summary,
        )

    async def get_dashboard(
        self,
        db: AsyncSession,
        current_user: User,
    ) -> DashboardResponse:
        user_id = str(current_user.id)
        user = await dashboard_repository.get_user(db, user_id)
        if user is None:
            user = current_user

        challenge = await dashboard_repository.get_daily_challenge(db)
        achievements = await dashboard_repository.get_achievements(db, user_id)
        battles_played, battles_won = await dashboard_repository.get_battle_stats(db, user_id)
        current_streak = await dashboard_repository.get_current_streak(db, user_id)

        user_xp = await xp_service.get_user_xp(db, current_user)
        total_xp = int(user_xp.total_xp or 0)
        user_level = int(user_xp.level or 1)
        rating = 1000
        user_stats = (
            await db.execute(
                select(UserStats).where(UserStats.user_id == user_id)
            )
        ).scalar_one_or_none()
        if user_stats:
            rating = getattr(user_stats, "rating", 1000) or 1000

        stats = DashboardStats(
            xp=total_xp,
            level=user_level,
            streak=current_streak,
            rating=rating,
            battles_played=battles_played,
            battles_won=battles_won,
        )

        weekly: list[WeeklyActivity] = []

        achievement_list = [
            Achievement(
                id=str(getattr(item, "id", "0")),
                title=str(getattr(item, "title", "Achievement") or "Achievement"),
                description=str(getattr(item, "description", "Keep practicing to unlock achievements.") or "Keep practicing to unlock achievements."),
                icon=str(getattr(item, "icon", "trophy") or "trophy"),
            )
            for item in achievements
        ]

        skill_result = await db.execute(
            select(UserSkillStat).where(
                UserSkillStat.user_id == user_id,
                UserSkillStat.total_attempts > 0,
            )
        )
        skill_evidence = list(skill_result.scalars().all())
        weakest_skill = min(
            skill_evidence,
            key=lambda skill: skill.correct_attempts / skill.total_attempts,
            default=None,
        )
        if weakest_skill:
            accuracy = round(weakest_skill.correct_attempts / weakest_skill.total_attempts * 100)
            recommendation = AIRecommendation(
                title=f"Practice {weakest_skill.subject}",
                message=(
                    f"Your recorded accuracy is {accuracy}% "
                    f"({weakest_skill.correct_attempts} of {weakest_skill.total_attempts} attempts). "
                    "Focused practice in this area is your clearest next step."
                ),
                progress=accuracy,
                action=f"Practice {weakest_skill.subject}",
            )
        elif stats.battles_played == 0:
            recommendation = AIRecommendation(
                title="Record your first result",
                message="There is not enough assessment or practice evidence to personalize a next step yet.",
                progress=0,
                action="Start practice",
            )
        else:
            recommendation = AIRecommendation(
                title="Build on your battle activity",
                message=f"You have {stats.battles_played} recorded battles. Try a new practice topic to add skill evidence.",
                progress=min(stats.battles_played, 100),
                action="Explore practice",
            )

        if challenge is None:
            daily = DailyChallenge(
                id="0",
                title="No daily challenge available",
                difficulty="Easy",
                description="Check back later for a new challenge.",
                xp_reward=0,
            )
        else:
            daily = DailyChallenge(
                id=str(getattr(challenge, "id", 0)),
                title=str(getattr(challenge, "title", "Daily challenge") or "Daily challenge"),
                difficulty=str(getattr(challenge, "difficulty", "Easy") or "Easy"),
                description=str(
                    f"Solve today's {getattr(challenge, 'category', 'coding') or 'coding'} challenge "
                    "to maintain your streak."
                ),
                xp_reward=int(getattr(challenge, "xp_reward", 100) or 100),
            )

        command_center = await self.get_command_center(db, current_user)

        return DashboardResponse(
            user=UserSummary(
                id=str(user.id),
                username=str(getattr(user, "username", None) or "player"),
                full_name=str(getattr(user, "full_name", None) or getattr(user, "username", None) or "SkillBattle player"),
                email=str(getattr(user, "email", None) or ""),
                avatar_url=getattr(user, "avatar_url", None),
                role=str(getattr(user, "role", "user") or "user"),
                is_superuser=bool(getattr(user, "is_superuser", False)),
            ),
            stats=stats,
            weekly_activity=weekly,
            achievements=achievement_list,
            ai_recommendation=recommendation,
            daily_challenge=daily,
            command_center=command_center,
        )


dashboard_service = DashboardService()