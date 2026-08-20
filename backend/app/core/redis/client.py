"""
=========================================================

Redis Manager — graceful fallback when Redis is unavailable

=========================================================
"""

from __future__ import annotations

import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class _NoopRedis:
    """A no-op Redis client used when Redis is not available."""

    async def incr(self, key: str) -> int:
        return 0

    async def expire(self, key: str, seconds: int) -> None:
        pass

    async def get(self, key: str):
        return None

    async def set(self, key: str, value, ex=None) -> None:
        pass

    async def delete(self, *keys) -> None:
        pass

    async def ping(self) -> bool:
        return False

    async def close(self) -> None:
        pass


class RedisManager:

    def __init__(self):
        self.client = _NoopRedis()
        self._available = False
        self._try_connect()

    def _try_connect(self):
        try:
            import redis.asyncio as redis  # noqa: F401
            self.client = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=2,
            )
            self._available = True
            logger.info("✅ Redis connected at %s", settings.REDIS_URL)
        except Exception as e:
            logger.warning(
                "⚠️  Redis unavailable (%s). Rate limiting disabled.", e
            )
            self.client = _NoopRedis()
            self._available = False

    async def ping(self):
        try:
            return await self.client.ping()
        except Exception:
            return False

    async def close(self):
        try:
            await self.client.close()
        except Exception:
            pass


redis_manager = RedisManager()