"""
=========================================================

Tournament Worker

=========================================================
"""

from __future__ import annotations

import logging
from app.workers.worker import Worker

logger = logging.getLogger(__name__)


class TournamentWorker(Worker):

    QUEUE = "tournament"

    async def process(
        self,
        payload: dict,
    ):
        logger.info("Tournament Job processed: %s", payload)


tournament_worker = TournamentWorker()