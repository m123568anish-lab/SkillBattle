"""
=========================================================

SkillBattle

Application Shutdown

=========================================================
"""

from __future__ import annotations

import logging

from app.core.redis.client import (
    redis_manager,
)

logger = logging.getLogger(__name__)


async def shutdown():

    logger.info("=" * 60)
    logger.info("Stopping SkillBattle...")
    logger.info("=" * 60)

    try:

        await redis_manager.close()

        logger.info("Redis Closed")

    except Exception as exc:

        logger.exception(exc)

    logger.info("Workers Stopped")

    logger.info("WebSockets Closed")

    logger.info("Database Closed")

    logger.info("Shutdown Complete")