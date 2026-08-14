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


class BattleRewardService:

    """
    Handles battle rewards.

    NOTE:
    XP, achievements and leaderboard integrations are
    intentionally left as async hooks until those
    modules are fully migrated.
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

        rewards = []

        for participant in participants:

            reward = {

                "user_id": participant.user_id,

                "winner": participant.user_id == winner.user_id,

                "xp": self.WIN_XP
                if participant.user_id == winner.user_id
                else self.PARTICIPATION_XP,

                "rating_change": self.WIN_RATING
                if participant.user_id == winner.user_id
                else self.LOSS_RATING,

            }

            rewards.append(reward)

            logger.info(

                "Reward prepared | user=%s xp=%s",

                reward["user_id"],

                reward["xp"],

            )

            #
            # Future Integrations
            #
            # await xp_service.add_xp(...)
            #
            # await achievement_service.check(...)
            #
            # await leaderboard_service.refresh(...)
            #

        return {

            "winner": winner.user_id,

            "players": len(participants),

            "rewards": rewards,

        }


battle_reward_service = BattleRewardService()