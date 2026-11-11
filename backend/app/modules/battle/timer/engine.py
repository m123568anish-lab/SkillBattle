"""
=========================================================

SkillBattle

Battle Timer Engine

Production Version

=========================================================
"""

from __future__ import annotations

import asyncio

from app.modules.battle.websocket import (
    battle_ws,
)

from app.modules.battle.events import (
    BattleEvent,
)


class BattleTimerEngine:

    """
    Handles battle countdowns.
    """

    def __init__(self):

        self.running: dict[str, int] = {}
        self._tasks: dict[str, asyncio.Task] = {}

    def schedule(self, battle_id: str, duration: int) -> None:
        self.stop(battle_id)
        task = asyncio.create_task(self.start(battle_id, duration))
        self._tasks[battle_id] = task
        task.add_done_callback(
            lambda completed: self._tasks.pop(battle_id, None)
            if self._tasks.get(battle_id) is completed
            else None
        )

    # =====================================================
    # Start Timer
    # =====================================================

    async def start(
        self,
        battle_id: str,
        duration: int,
    ):

        self.running[battle_id] = duration

        while True:

            remaining = self.running.get(
                battle_id,
            )

            if remaining is None:
                return

            if remaining <= 0:
                break

            await battle_ws.broadcast(

                battle_id,

                BattleEvent.TIMER_UPDATED.value,

                {

                    "remaining_seconds": remaining,

                },

            )

            await asyncio.sleep(1)

            if battle_id in self.running:

                self.running[battle_id] -= 1

        self.running.pop(
            battle_id,
            None,
        )

    # =====================================================
    # Stop Timer
    # =====================================================

    def stop(
        self,
        battle_id: str,
    ):
        self.running.pop(
            battle_id,
            None,
        )
        task = self._tasks.pop(battle_id, None)
        if task is not None and not task.done():
            task.cancel()

    # =====================================================
    # Remaining Seconds
    # =====================================================

    def remaining(
        self,
        battle_id: str,
    ) -> int:

        return self.running.get(
            battle_id,
            0,
        )

    # =====================================================
    # Running?
    # =====================================================

    def is_running(
        self,
        battle_id: str,
    ) -> bool:

        return battle_id in self.running


battle_timer = BattleTimerEngine()