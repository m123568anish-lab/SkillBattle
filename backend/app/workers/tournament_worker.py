"""
=========================================================

Tournament Worker

=========================================================
"""

from __future__ import annotations

from app.workers.worker import Worker


class TournamentWorker(Worker):

    QUEUE = "tournament"

    async def process(
        self,
        payload: dict,
    ):

        print(

            "Tournament Job",

            payload,

        )


tournament_worker = TournamentWorker()