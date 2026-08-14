"""
=========================================================

Battle Worker

=========================================================
"""

from __future__ import annotations

from app.workers.worker import Worker


class BattleWorker(Worker):

    QUEUE = "battle"

    async def process(
        self,
        payload: dict,
    ):

        print(

            "Battle Job",

            payload,

        )


battle_worker = BattleWorker()