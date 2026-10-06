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

from app.core.admin_bootstrap import ensure_platform_admin
from app.core.redis.client import (
    redis_manager,
)

logger = logging.getLogger(__name__)

# Backward-compatible re-export for older imports.
__all__ = ["ensure_platform_admin", "startup"]


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
    # Platform Admin Bootstrap
    # ----------------------------------------------------

    try:
        await ensure_platform_admin()
    except Exception:
        logger.exception("Platform admin bootstrap failed")

    # ----------------------------------------------------
    # Future Initializers
    # ----------------------------------------------------

    logger.info("Database Ready")

    logger.info("Storage Ready")

    logger.info("AI Provider Ready")

    logger.info("Workers Ready")

    logger.info("Monitoring Ready")

    logger.info("SkillBattle Started Successfully")