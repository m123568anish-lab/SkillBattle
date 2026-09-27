"""
=========================================================

SkillBattle

Battle Reward Service

Production Async Version

=========================================================
"""

from __future__ import annotations

import logging
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select

from app.modules.battle.leaderboard import (
    battle_leaderboard_service,
)

logger = logging.getLogger(__name__)


from app.models.user import User
from app.models.battle import BattleResult, BattleRoom
from app.models.user_stats import UserStats
from app.modules.xp.service import xp_service


class BattleRewardService:

    """
    Handles battle rewards and atomic DB updates for XP, ratings, and achievements.
    """

    WIN_XP = 150

    PARTICIPATION_XP = 50

    WIN_RATING = 25

    LOSS_RATING = -10

    # =====================================================
    # Finish Battle
    # =====================================================

    async def finish_battle(
        self,
        db: AsyncSession,
        battle_id: str,
    ):
        battle_result = await db.execute(
            select(BattleRoom)
            .where(BattleRoom.id == battle_id)
            .with_for_update()
        )
        battle = battle_result.scalar_one_or_none()
        if battle is None:
            return None

        existing_result = await db.execute(
            select(BattleResult).where(BattleResult.battle_id == battle_id)
        )
        saved_result = existing_result.scalar_one_or_none()
        if saved_result is not None:
            return {
                "winner": saved_result.winner_id,
                "draw": saved_result.is_draw,
                "players": saved_result.total_players,
                "rewards": [],
            }

        participants = await battle_leaderboard_service.update_final(
            db,
            battle_id,
        )

        if not participants:
            return None

        winner = participants[0]
        # Check if score is tied for top players
        draw = len(participants) > 1 and (participants[0].score == participants[1].score)

        rewards = []
        total_xp_earned = 0
        battle.ended_at = datetime.utcnow()
        battle.status = "finished"

        for participant in participants:
            is_winner = (participant.user_id == winner.user_id) and not draw
            xp_earned = self.WIN_XP if is_winner else self.PARTICIPATION_XP
            rating_change = self.WIN_RATING if is_winner else self.LOSS_RATING

            # Fetch User model and atomically grant XP + Rating
            stmt = select(User).where(User.id == participant.user_id)
            res = await db.execute(stmt)
            user = res.scalar_one_or_none()
            if user is None:
                raise RuntimeError(f"Battle participant user {participant.user_id} no longer exists")

            progression = await xp_service.add_xp(
                db,
                user,
                xp_earned,
                commit=False,
            )
            user.coding_rating = max(0, (user.coding_rating or 1000) + rating_change)
            stats_result = await db.execute(
                select(UserStats).where(UserStats.user_id == user.id).with_for_update()
            )
            stats = stats_result.scalar_one_or_none()
            if stats is not None:
                stats.rating = max(0, stats.rating + rating_change)
            db.add(user)

            reward = {
                "user_id": participant.user_id,
                "winner": is_winner,
                "xp": xp_earned,
                "rating_change": rating_change,
                "total_xp": progression.total_xp,
                "level": progression.level,
            }
            rewards.append(reward)
            total_xp_earned += xp_earned

            logger.info(
                "Reward granted | user=%s xp=%s winner=%s",
                participant.user_id,
                xp_earned,
                is_winner,
            )

        started_at = battle.started_at or battle.created_at
        duration_seconds = max(0, int((battle.ended_at - started_at).total_seconds()))
        db.add(BattleResult(
            battle_id=battle_id,
            winner_id=None if draw else winner.user_id,
            is_draw=draw,
            total_players=len(participants),
            duration_seconds=duration_seconds,
            winner_score=winner.score,
            average_score=sum(player.score for player in participants) / len(participants),
            rating_change=0 if draw else self.WIN_RATING,
            xp_earned=total_xp_earned,
        ))

        await db.commit()

        return {
            "winner": None if draw else winner.user_id,
            "draw": draw,
            "players": len(participants),
            "rewards": rewards,
        }


battle_reward_service = BattleRewardService()
