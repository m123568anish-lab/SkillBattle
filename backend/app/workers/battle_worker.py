"""
=========================================================

Battle Worker

=========================================================
"""

from __future__ import annotations

import logging
from app.workers.worker import Worker

logger = logging.getLogger(__name__)


class BattleWorker(Worker):

    QUEUE = "battle"

    async def process(
        self,
        payload: dict,
    ):
        logger.info("Battle Job processed: %s", payload)


battle_worker = BattleWorker()