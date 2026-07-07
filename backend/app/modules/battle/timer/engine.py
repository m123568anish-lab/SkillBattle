import asyncio

from app.modules.battle.websocket import (
    battle_ws,
    BattleEvent,
)


class BattleTimerEngine:

    """
    Handles battle countdowns.
    """

    def __init__(self):

        self.running = {}

    # =====================================================

    async def start(

        self,

        battle_id: str,

        duration: int,

    ):

        self.running[battle_id] = duration

        while self.running[battle_id] > 0:

            await battle_ws.broadcast(

                battle_id,

                BattleEvent.TIMER_UPDATED,

                {

                    "remaining_seconds":
                    self.running[battle_id]

                }

            )

            await asyncio.sleep(1)

            self.running[battle_id] -= 1

        await battle_ws.broadcast(

            battle_id,

            BattleEvent.BATTLE_FINISHED,

            {

                "battle_id": battle_id,

            }

        )

        del self.running[battle_id]

    # =====================================================

    def remaining(

        self,

        battle_id: str,

    ):

        return self.running.get(

            battle_id,

            0,

        )

    # =====================================================

    def is_running(

        self,

        battle_id: str,

    ):

        return battle_id in self.running


battle_timer = BattleTimerEngine()