"""
=========================================================

SkillBattle

Dashboard Service

=========================================================
"""

from datetime import datetime, timedelta

from sqlalchemy import case, func, select
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
from app.models.xp import XPLedger
from app.models.compiler import CodeSubmission
from app.models.daily_practice import DailyPracticeSession
from app.models.question import UserSubmission
from app.models.streak import Streak, UserDailyActivity

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
    SkillProgress,
    RecentActivity,
)


class DashboardService:

    async def get_command_center(
        self,
        db: AsyncSession,
        current_user: User,
        total_xp: int | None = None,
        current_streak: int | None = None,
    ) -> dict:
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

        if total_xp is None:
            user_xp = await xp_service.get_user_xp(db, current_user)
            total_xp = int(getattr(user_xp, "total_xp", 0) or 0)
        if current_streak is None:
            current_streak = await dashboard_repository.get_current_streak(db, user_id)
        roadmap = await roadmap_service.get_roadmap(db, current_user)
        roadmap_summary = None
        if roadmap is not None:
            roadmap_summary = {
                "title": roadmap.title,
                "progress": int(getattr(roadmap, "progress", 0) or 0),
                "milestone": (roadmap.weeks[0].title if roadmap.weeks else "Roadmap active"),
            }

        # Collect recent evidence from the canonical skill intelligence system using projected lightweight columns.
        evidence = []
        from sqlalchemy import select
        from app.models.question import Question, UserSubmission
        from app.models.assessment_engine import AssessmentQuestionSubmission
        from app.models.battle.battle_submission import BattleSubmission

        practice_stmt = (
            select(
                UserSubmission.id,
                UserSubmission.question_id,
                UserSubmission.solved,
                UserSubmission.execution_time_ms,
                UserSubmission.created_at,
                Question.skill_category,
                Question.difficulty,
            )
            .join(Question, Question.id == UserSubmission.question_id)
            .where(UserSubmission.user_id == user_id)
            .order_by(UserSubmission.created_at.desc())
            .limit(30)
        )
        for (sub_id, q_id, solved, exec_time, created_at, skill_category, difficulty) in (await db.execute(practice_stmt)).all():
            evidence.append({
                "user_id": user_id,
                "skill_id": skill_category or "Problem Solving",
                "source_type": "PRACTICE",
                "source_id": f"practice:{sub_id}",
                "submission_id": str(sub_id),
                "question_id": str(q_id),
                "difficulty": (difficulty or "medium").lower(),
                "correct": bool(solved),
                "score": 1.0 if solved else 0.0,
                "max_score": 1.0,
                "response_time_ms": exec_time or 0,
                "attempt_number": 1,
                "timestamp": created_at.isoformat() if created_at else "",
            })

        battle_stmt = (
            select(
                BattleSubmission.id,
                BattleSubmission.question_id,
                BattleSubmission.passed_tests,
                BattleSubmission.total_tests,
                BattleSubmission.verdict,
                BattleSubmission.time_taken_seconds,
                BattleSubmission.submitted_at,
                BattleSubmission.question_type,
                Question.skill_category,
            )
            .outerjoin(Question, Question.id == BattleSubmission.question_id)
            .where(BattleSubmission.user_id == user_id)
            .order_by(BattleSubmission.submitted_at.desc())
            .limit(30)
        )
        for (sub_id, q_id, passed_tests, total_tests, verdict, time_taken, submitted_at, q_type, skill_category) in (await db.execute(battle_stmt)).all():
            total_t = total_tests or 1
            score_ratio = round(((passed_tests or 0) / total_t) if total_t else 1.0, 4)
            accepted = verdict in ("Accepted", "Correct")
            evidence.append({
                "user_id": user_id,
                "skill_id": skill_category if skill_category else str(q_type or "Problem Solving"),
                "source_type": "BATTLE",
                "source_id": f"battle:{sub_id}",
                "submission_id": str(sub_id),
                "question_id": str(q_id or sub_id),
                "difficulty": "medium",
                "correct": bool(accepted or score_ratio >= 0.5),
                "score": score_ratio,
                "max_score": 1.0,
                "response_time_ms": int((time_taken or 0) * 1000),
                "attempt_number": 1,
                "timestamp": submitted_at.isoformat() if submitted_at else "",
            })

        assessment_stmt = (
            select(
                AssessmentQuestionSubmission.id,
                AssessmentQuestionSubmission.attempt_id,
                AssessmentQuestionSubmission.question_id,
                AssessmentQuestionSubmission.score_awarded,
                AssessmentQuestionSubmission.max_score,
                AssessmentQuestionSubmission.execution_time_ms,
                AssessmentQuestionSubmission.created_at,
                Question.skill_category,
                Question.difficulty,
            )
            .join(Question, Question.id == AssessmentQuestionSubmission.question_id)
            .where(AssessmentQuestionSubmission.user_id == user_id)
            .order_by(AssessmentQuestionSubmission.created_at.desc())
            .limit(30)
        )
        for (sub_id, attempt_id, q_id, score_awarded, max_score, exec_time, created_at, skill_category, difficulty) in (await db.execute(assessment_stmt)).all():
            m_score = max_score or 1.0
            evidence.append({
                "user_id": user_id,
                "skill_id": skill_category or "Problem Solving",
                "source_type": "ASSESSMENT",
                "source_id": f"assessment:{attempt_id}",
                "submission_id": str(sub_id),
                "question_id": str(q_id),
                "difficulty": (difficulty or "medium").lower(),
                "correct": (score_awarded or 0.0) >= (m_score * 0.5),
                "score": ((score_awarded or 0.0) / m_score) if m_score else 1.0,
                "max_score": 1.0,
                "response_time_ms": exec_time or 0,
                "attempt_number": 1,
                "timestamp": created_at.isoformat() if created_at else "",
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
        user = current_user

        challenge = await dashboard_repository.get_daily_challenge(db)
        achievements = await dashboard_repository.get_achievements(db, user_id)
        battles_played, battles_won, battles_lost = await dashboard_repository.get_battle_stats(db, user_id)
        current_streak, longest_streak = await dashboard_repository.get_streak_stats(db, user_id)

        user_xp = await xp_service.reconcile_xp(db, current_user, commit=False)
        total_xp = int(user_xp.total_xp or 0)
        user_level = int(user_xp.level or 1)
        next_level_xp = user_level * 500
        level_floor_xp = (user_level - 1) * 500
        level_progress_percent = min(
            100,
            max(0, round((total_xp - level_floor_xp) / 500 * 100)),
        )

        coding_attempts = int(
            (await db.execute(
                select(func.count(CodeSubmission.id)).where(
                    CodeSubmission.user_id == user_id,
                )
            )).scalar_one_or_none() or 0
        )
        mcq_attempts = int(
            (await db.execute(
                select(
                    func.coalesce(
                        func.sum(
                            case(
                                (UserSubmission.total_tests > 0, UserSubmission.total_tests),
                                else_=1,
                            )
                        ),
                        0,
                    )
                ).where(
                    UserSubmission.user_id == user_id
                )
            )).scalar_one_or_none() or 0
        )
        practice_attempted = coding_attempts + mcq_attempts
        practice_completed = int(
            (await db.execute(
                select(func.count(func.distinct(CodeSubmission.problem_id))).where(
                    CodeSubmission.user_id == user_id,
                    CodeSubmission.verdict == "Accepted",
                )
            )).scalar_one_or_none() or 0
        )
        practice_completed += int(
            (await db.execute(
                select(func.count(func.distinct(UserSubmission.question_id))).where(
                    UserSubmission.user_id == user_id,
                    UserSubmission.solved.is_(True),
                )
            )).scalar_one_or_none() or 0
        )
        correct_coding_attempts = int(
            (await db.execute(
                select(func.count(CodeSubmission.id)).where(
                    CodeSubmission.user_id == user_id,
                    CodeSubmission.verdict == "Accepted",
                )
            )).scalar_one_or_none() or 0
        )
        correct_mcq_attempts = int(
            (await db.execute(
                select(
                    func.coalesce(
                        func.sum(
                            case(
                                (UserSubmission.total_tests > 0, UserSubmission.passed_tests),
                                (UserSubmission.solved.is_(True), 1),
                                else_=0,
                            )
                        ),
                        0,
                    )
                ).where(
                    UserSubmission.user_id == user_id
                )
            )).scalar_one_or_none() or 0
        )
        practice_tasks_completed = int(
            (await db.execute(
                select(func.count(DailyPracticeSession.id)).where(
                    DailyPracticeSession.user_id == user_id,
                    DailyPracticeSession.status == "COMPLETED",
                )
            )).scalar_one_or_none() or 0
        )
        daily_challenge_completed = bool(
            challenge is not None
            and (await db.execute(
                select(DailyPracticeSession.id).where(
                    DailyPracticeSession.user_id == user_id,
                    DailyPracticeSession.session_date == datetime.utcnow().date(),
                    DailyPracticeSession.challenge_id == challenge.id,
                    DailyPracticeSession.status == "COMPLETED",
                ).limit(1)
            )).scalar_one_or_none()
        )
        practice_accuracy = (
            round((correct_coding_attempts + correct_mcq_attempts) / practice_attempted * 100, 1)
            if practice_attempted
            else None
        )
        stats_rating = (
            await db.execute(
                select(UserStats.rating).where(UserStats.user_id == user_id)
            )
        ).scalar_one_or_none()
        rating = int(stats_rating or 0)

        stats = DashboardStats(
            xp=total_xp,
            level=user_level,
            next_level_xp=next_level_xp,
            xp_to_next_level=max(0, next_level_xp - total_xp),
            level_progress_percent=level_progress_percent,
            streak=current_streak,
            longest_streak=longest_streak,
            rating=rating,
            battles_played=battles_played,
            battles_completed=battles_played,
            battles_won=battles_won,
            battles_lost=battles_lost,
            practice_attempted=practice_attempted,
            practice_completed=practice_completed,
            practice_tasks_completed=practice_tasks_completed,
            practice_accuracy=practice_accuracy,
            daily_challenge_completed=daily_challenge_completed,
        )

        today = datetime.utcnow().date()
        activity_start = today - timedelta(days=6)
        activity_result = await db.execute(
            select(XPLedger.created_at, XPLedger.amount)
            .where(
                XPLedger.user_id == user_id,
                XPLedger.created_at >= datetime.combine(activity_start, datetime.min.time()),
            )
            .order_by(XPLedger.created_at.asc())
        )
        activity_by_day: dict[str, int] = {
            (activity_start + timedelta(days=offset)).isoformat(): 0
            for offset in range(7)
        }
        for created_at, amount in activity_result.all():
            if created_at:
                day = created_at.date().isoformat()
                activity_by_day[day] = activity_by_day.get(day, 0) + int(amount or 0)

        # Include qualifying activity that earned no XP.
        daily_acts = (await db.execute(
            select(UserDailyActivity.activity_date, UserDailyActivity.xp_earned)
            .where(
                UserDailyActivity.user_id == user_id,
                UserDailyActivity.activity_date >= activity_start,
            )
        )).all()
        for act_date, act_xp in daily_acts:
            if act_date:
                day_str = act_date.isoformat()
                activity_by_day[day_str] = max(activity_by_day.get(day_str, 0), int(act_xp or 0))

        weekly = [WeeklyActivity(day=day, xp=xp) for day, xp in sorted(activity_by_day.items())]

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
            select(
                UserSkillStat.subject,
                UserSkillStat.correct_attempts,
                UserSkillStat.total_attempts,
            ).where(
                UserSkillStat.user_id == user_id,
                UserSkillStat.total_attempts > 0,
            )
        )
        skill_evidence = list(skill_result.all())
        skill_progress = [
            SkillProgress(
                subject=str(subject),
                correct_attempts=int(correct or 0),
                total_attempts=int(total or 0),
                accuracy_percent=round((correct or 0) / total * 100) if total else 0,
            )
            for subject, correct, total in skill_evidence
        ]
        weakest_skill = min(
            skill_evidence,
            key=lambda row: row[1] / row[2],
            default=None,
        )
        if weakest_skill:
            accuracy = round(weakest_skill[1] / weakest_skill[2] * 100)
            recommendation = AIRecommendation(
                title=f"Practice {weakest_skill[0]}",
                message=(
                    f"Your recorded accuracy is {accuracy}% "
                    f"({weakest_skill[1]} of {weakest_skill[2]} attempts). "
                    "Focused practice in this area is your clearest next step."
                ),
                progress=accuracy,
                action=f"Practice {weakest_skill[0]}",
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
                progress=0,
                action="Explore practice",
            )

        if challenge is None:
            daily = DailyChallenge(
                id="0",
                title="No daily challenge available",
                difficulty="Unavailable",
                description="Check back later for a new challenge.",
                xp_reward=0,
                is_completed=False,
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
                xp_reward=int(getattr(challenge, "xp_reward", 0) or 0),
                is_completed=daily_challenge_completed,
            )

        recent_activity = await dashboard_repository.get_recent_activity(db, user_id)

        command_center = await self.get_command_center(
            db,
            current_user,
            total_xp=total_xp,
            current_streak=current_streak,
        )

        return DashboardResponse(
            user=UserSummary(
                id=str(user.id),
                username=str(getattr(user, "username", None) or ""),
                full_name=str(getattr(user, "full_name", None) or getattr(user, "username", None) or ""),
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
            skill_progress=skill_progress,
            recent_activity=[
                RecentActivity(
                    activity_type=activity.activity_type,
                    activity_date=activity.activity_date.isoformat(),
                    xp_earned=activity.xp_earned,
                )
                for activity in recent_activity
            ],
            command_center=command_center,
        )


dashboard_service = DashboardService()
