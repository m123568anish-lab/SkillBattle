"""
=========================================================

Base Worker

=========================================================
"""

from __future__ import annotations

import asyncio
import logging

from app.core.redis.queue import queue_service

logger = logging.getLogger(__name__)


class Worker:

    QUEUE = ""

    async def process(
        self,
        payload: dict,
    ):
        raise NotImplementedError

    async def run(self):

        while True:

            job = await queue_service.pop(
                self.QUEUE,
            )

            if job:

                try:

                    await self.process(job)

                except Exception as exc:

                    logger.error(f"Error processing job in queue {self.QUEUE}: {exc}", exc_info=True)

            else:

                await asyncio.sleep(1)