import asyncio

from app.modules.battle.timer import battle_timer
from app.modules.battle.websocket import (
    battle_ws,
    BattleEvent,
)
from app.modules.battle.reward import (
    battle_reward_service,
)
# Do not import tournament scheduler here to avoid import cycles.

class BattleOrchestrator:

    """
    Coordinates the complete lifecycle of a battle.
    """

    def __init__(self):

        self.active_battles = {}

    # =====================================================

    async def start_battle(
        self,
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

            BattleEvent.BATTLE_STARTED,

            {

                "battle_id": battle_id,

            },

        )

        await battle_timer.start(

            battle_id,

            duration,

        )

        battle_reward_service.finish_battle(
            self.db,
            battle_id,
)

        await self.finish_battle(
         battle_id,
)

    # =====================================================

    async def finish_battle(
        self,
        battle_id: str,
    ):

        await battle_ws.broadcast(

            battle_id,

            BattleEvent.BATTLE_FINISHED,

            {

                "battle_id": battle_id,

            },

        )

        self.active_battles.pop(
            battle_id,
            None,
        )

    # =====================================================

    def running(
        self,
        battle_id: str,
    ):

        return battle_id in self.active_battles
    


battle_orchestrator = BattleOrchestrator()