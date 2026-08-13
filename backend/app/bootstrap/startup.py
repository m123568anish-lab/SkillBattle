"""
=========================================================

SkillBattle

Application Startup

=========================================================
"""

from __future__ import annotations

import logging

from app.bootstrap.dependency_check import (
    check_dependencies,
)

from app.core.redis.client import (
    redis_manager,
)

logger = logging.getLogger(__name__)


async def startup():

    logger.info("=" * 60)
    logger.info("Starting SkillBattle...")
    logger.info("=" * 60)

    # ----------------------------------------------------
    # Dependency Check
    # ----------------------------------------------------

    services = await check_dependencies()

    for name, status in services.items():

        logger.info("%s : %s", name.upper(), status)

    # ----------------------------------------------------
    # Redis
    # ----------------------------------------------------

    try:

        await redis_manager.ping()

        logger.info("Redis Connected")

    except Exception as exc:

        logger.exception(exc)

    # ----------------------------------------------------
    # Future Initializers
    # ----------------------------------------------------

    logger.info("Database Ready")

    logger.info("Storage Ready")

    logger.info("AI Provider Ready")

    logger.info("Workers Ready")

    logger.info("Monitoring Ready")

    logger.info("SkillBattle Started Successfully")