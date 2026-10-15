"""
=========================================================

Redis Rate Limiter

=========================================================
"""

from __future__ import annotations

import time
from collections import defaultdict, deque

from app.core.redis.client import (
    redis_manager,
)


class RateLimiter:

    def __init__(self) -> None:
        # Development and single-process deployments still get protection
        # when Redis is unavailable. Redis remains the authoritative shared
        # counter whenever it is configured and reachable.
        self._local_hits: dict[str, deque[float]] = defaultdict(deque)

    def _allow_local(self, key: str, limit: int, window: int) -> bool:
        now = time.monotonic()
        hits = self._local_hits[key]
        while hits and now - hits[0] >= window:
            hits.popleft()
        if len(hits) >= limit:
            return False
        hits.append(now)
        return True

    async def allow(

        self,

        key: str,

        limit: int,

        window: int,

    ) -> bool:

        if not getattr(redis_manager, "_available", False):
            return self._allow_local(key, limit, window)

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
            return self._allow_local(key, limit, window)


rate_limiter = RateLimiter()
