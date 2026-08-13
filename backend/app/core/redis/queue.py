"""
=========================================================

Queue Service

=========================================================
"""

from __future__ import annotations

import json

from app.core.redis.client import (
    redis_manager,
)


class QueueService:

    async def push(
        self,
        queue: str,
        payload: dict,
    ):

        await redis_manager.client.rpush(

            queue,

            json.dumps(payload),

        )

    async def pop(
        self,
        queue: str,
    ):

        item = await redis_manager.client.lpop(
            queue,
        )

        if item is None:

            return None

        return json.loads(item)

    async def length(
        self,
        queue: str,
    ):

        return await redis_manager.client.llen(
            queue,
        )


queue_service = QueueService()