"""
=========================================================

Dependency Checker

=========================================================
"""

from __future__ import annotations

from app.core.redis.client import redis_manager


async def check_dependencies():

    services = {}

    # Redis
    try:

        await redis_manager.ping()

        services["redis"] = "OK"

    except Exception as exc:

        services["redis"] = str(exc)

    return services