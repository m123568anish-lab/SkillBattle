"""
=========================================================

Cache Service

=========================================================
"""

from __future__ import annotations

import json

from app.core.redis.client import (
    redis_manager,
)


class CacheService:

    DEFAULT_TTL = 300

    # =====================================================
    # Get
    # =====================================================

    async def get(
        self,
        key: str,
    ):

        value = await redis_manager.client.get(
            key,
        )

        if value is None:

            return None

        return json.loads(value)

    # =====================================================
    # Set
    # =====================================================

    async def set(
        self,
        key: str,
        value,
        ttl: int | None = None,
    ):

        await redis_manager.client.set(

            key,

            json.dumps(value),

            ex=ttl or self.DEFAULT_TTL,

        )

    # =====================================================
    # Delete
    # =====================================================

    async def delete(
        self,
        key: str,
    ):

        await redis_manager.client.delete(
            key,
        )

    # =====================================================
    # Exists
    # =====================================================

    async def exists(
        self,
        key: str,
    ):

        return await redis_manager.client.exists(
            key,
        )


cache_service = CacheService()