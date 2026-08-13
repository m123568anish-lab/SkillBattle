"""
=========================================================

SkillBattle

Battle Orchestrator

Production Version

=========================================================
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.battle.timer import battle_timer

from app.modules.battle.websocket import (
    battle_ws,
)

from app.modules.battle.events import (
    BattleEvent,
)

from app.modules.battle.reward import (
    battle_reward_service,
)


class BattleOrchestrator:

    """
    Coordinates the complete lifecycle of a battle.
    """

    def __init__(self):

        self.active_battles: dict[str, dict] = {}

    # =====================================================
    # Start Battle
    # =====================================================

    async def start_battle(
        self,
        db: AsyncSession,
        battle_id: str,
        duration: int,
    ):

        if battle_id in self.active_battles:
            return

        self.active_battles[battle_id] = {

            "status": "running",

        }

        await battle_ws.broadcast(

            battle_id,

            BattleEvent.BATTLE_STARTED.value,

            {

                "battle_id": battle_id,

            },

        )

        await battle_timer.start(

            battle_id,

            duration,

        )

        await battle_reward_service.finish_battle(

            db,

            battle_id,

        )

        from app.modules.battle.service import battle_service

        await battle_service.finish_battle(

            db,

            battle_id,

        )

        self.active_battles.pop(

            battle_id,

            None,

        )

    # =====================================================
    # Force Finish
    # =====================================================

    async def finish_battle(
        self,
        db: AsyncSession,
        battle_id: str,
    ):

        from app.modules.battle.service import battle_service

        await battle_service.finish_battle(

            db,

            battle_id,

        )

        self.active_battles.pop(

            battle_id,

            None,

        )

    # =====================================================
    # Running?
    # =====================================================

    def running(
        self,
        battle_id: str,
    ) -> bool:

        return battle_id in self.active_battles


battle_orchestrator = BattleOrchestrator()