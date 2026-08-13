"""
=========================================================

Base Worker

=========================================================
"""

from __future__ import annotations

import asyncio

from app.core.redis.queue import (
    queue_service,
)


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

                    print(exc)

            else:

                await asyncio.sleep(1)