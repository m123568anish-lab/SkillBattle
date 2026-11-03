"""
=========================================================

SkillBattle

Leaderboard Repository

Production Async Repository

=========================================================
"""

from __future__ import annotations

from sqlalchemy import and_, case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.compiler import CodeSubmission
from app.models.battle import BattleParticipant, BattleResult
from app.models.user import User
from app.models.xp import XP
from app.models.streak import Streak
from app.models.user_stats import UserStats


class LeaderboardRepository:
    @staticmethod
    def eligible_users():
        return (
            User.account_type == "STUDENT",
            User.is_active.is_(True),
            func.upper(User.status) == "ACTIVE",
        )

    async def global_leaderboard(
        self,
        db: AsyncSession,
        limit: int = 100,
    ):
        filters = self.eligible_users()
        result = await db.execute(
            select(
                User,
                XP,
                Streak,
                UserStats,
                (
                    select(func.count(func.distinct(CodeSubmission.problem_id)))
                    .where(
                        CodeSubmission.user_id == User.id,
                        CodeSubmission.verdict == "Accepted",
                    )
                    .correlate(User)
                    .scalar_subquery()
                ).label("solved"),
            )
            .outerjoin(
                XP,
                XP.user_id == User.id,
            )
            .outerjoin(
                Streak,
                Streak.user_id == User.id,
            )
            .outerjoin(
                UserStats,
                UserStats.user_id == User.id,
            )
            .order_by(
                func.coalesce(XP.total_xp, 0).desc(),
                User.id.asc(),
            )
            .where(*filters)
            .limit(limit)
        )
        rows = result.all()
        user_ids = [str(row[0].id) for row in rows]
        if not user_ids:
            return []

        battle_result = await db.execute(
            select(
                BattleParticipant.user_id,
                func.count(func.distinct(BattleResult.battle_id)),
                func.sum(
                    case(
                        (BattleResult.winner_id == BattleParticipant.user_id, 1),
                        else_=0,
                    )
                ),
                func.sum(
                    case(
                        (
                            and_(
                                BattleResult.winner_id != BattleParticipant.user_id,
                                BattleResult.is_draw.is_(False),
                            ),
                            1,
                        ),
                        else_=0,
                    )
                ),
                func.sum(
                    case((BattleResult.is_draw.is_(True), 1), else_=0)
                ),
            )
            .join(BattleResult, BattleResult.battle_id == BattleParticipant.battle_id)
            .where(
                BattleParticipant.user_id.in_(user_ids),
                BattleResult.completion_status == "completed",
            )
            .group_by(BattleParticipant.user_id)
        )
        battle_stats = {
            str(user_id): (
                int(count or 0),
                int(wins or 0),
                int(losses or 0),
                int(draws or 0),
            )
            for user_id, count, wins, losses, draws in battle_result.all()
        }

        return [
            (*row, *battle_stats.get(str(row[0].id), (0, 0, 0, 0)))
            for row in rows
        ]

    async def get_user_rank(
        self,
        db: AsyncSession,
        user_id: str,
    ):
        filters = self.eligible_users()
        current = (
            await db.execute(
                select(User.id, XP)
                .outerjoin(XP, XP.user_id == User.id)
                .where(User.id == user_id, *filters)
            )
        ).one_or_none()
        if current is None:
            return None, None, 0

        xp = current[1]
        current_xp = int(xp.total_xp or 0) if xp else 0
        eligible_count = int(
            (await db.execute(
                select(func.count(User.id)).where(*filters)
            )).scalar_one_or_none() or 0
        )
        ahead_count = int(
            (await db.execute(
                select(func.count(User.id))
                .outerjoin(XP, XP.user_id == User.id)
                .where(
                    *filters,
                    or_(
                        func.coalesce(XP.total_xp, 0) > current_xp,
                        and_(
                            func.coalesce(XP.total_xp, 0) == current_xp,
                            User.id < user_id,
                        ),
                    ),
                )
            )).scalar_one_or_none() or 0
        )
        return ahead_count + 1, xp, eligible_count


leaderboard_repository = LeaderboardRepository()
