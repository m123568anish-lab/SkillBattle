"""
=========================================================

Redis Manager

=========================================================
"""

from __future__ import annotations

import redis.asyncio as redis

from app.core.config import settings


class RedisManager:

    def __init__(self):

        self.client = redis.from_url(

            settings.REDIS_URL,

            decode_responses=True,

        )

    async def ping(self):

        return await self.client.ping()

    async def close(self):

        await self.client.close()


redis_manager = RedisManager()