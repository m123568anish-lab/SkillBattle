"""
=========================================================

Redis Rate Limiter

=========================================================
"""

from __future__ import annotations

import time

from app.core.redis.client import (
    redis_manager,
)


class RateLimiter:

    async def allow(

        self,

        key: str,

        limit: int,

        window: int,

    ) -> bool:

        now = int(time.time())

        bucket = f"rate:{key}:{now // window}"
        try:
            count = await redis_manager.client.incr(
                bucket,
            )

            if count == 1:
                await redis_manager.client.expire(
                    bucket,
                    window,
                )

            return count <= limit
        except Exception:
            # If Redis is unavailable, default to allowing the request
            return True


rate_limiter = RateLimiter()