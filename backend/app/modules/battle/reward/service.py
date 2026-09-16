"""
=========================================================

SkillBattle

Battle Reward Service

Production Async Version

=========================================================
"""

from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.battle.leaderboard import (
    battle_leaderboard_service,
)

logger = logging.getLogger(__name__)


from sqlalchemy import select
from app.models.user import User
from app.models.battle import BattleResult
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

        for participant in participants:
            is_winner = (participant.user_id == winner.user_id) and not draw
            xp_earned = self.WIN_XP if is_winner else self.PARTICIPATION_XP
            rating_change = self.WIN_RATING if is_winner else self.LOSS_RATING

            # Fetch User model and atomically grant XP + Rating
            stmt = select(User).where(User.id == participant.user_id)
            res = await db.execute(stmt)
            user = res.scalar_one_or_none()

            if user:
                await xp_service.add_xp(db, user, xp_earned)
                user.coding_rating = max(0, (user.coding_rating or 1200) + rating_change)
                db.add(user)

            reward = {
                "user_id": participant.user_id,
                "winner": is_winner,
                "xp": xp_earned,
                "rating_change": rating_change,
            }
            rewards.append(reward)

            logger.info(
                "Reward granted | user=%s xp=%s winner=%s",
                participant.user_id,
                xp_earned,
                is_winner,
            )

        # Record BattleResult in DB so dashboard stats update
        res_stmt = select(BattleResult).where(BattleResult.battle_id == battle_id)
        existing_res = (await db.execute(res_stmt)).scalar_one_or_none()
        if not existing_res:
            b_result = BattleResult(
                battle_id=battle_id,
                winner_id=None if draw else winner.user_id,
                is_draw=draw,
            )
            db.add(b_result)

        await db.commit()

        return {
            "winner": None if draw else winner.user_id,
            "players": len(participants),
            "rewards": rewards,
        }


battle_reward_service = BattleRewardService()