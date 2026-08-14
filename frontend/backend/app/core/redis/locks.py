"""
=========================================================

Distributed Locks

=========================================================
"""

from __future__ import annotations

from app.core.redis.client import (
    redis_manager,
)


class DistributedLock:

    async def acquire(

        self,

        key: str,

        ttl: int = 30,

    ):

        return await redis_manager.client.set(

            f"lock:{key}",

            "1",

            ex=ttl,

            nx=True,

        )

    async def release(

        self,

        key: str,

    ):

        await redis_manager.client.delete(

            f"lock:{key}",

        )


distributed_lock = DistributedLock()