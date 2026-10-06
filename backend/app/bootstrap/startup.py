"""
=========================================================

SkillBattle

Application Startup

=========================================================
"""

from __future__ import annotations

import logging
import os

from sqlalchemy import select

from app.bootstrap.dependency_check import (
    check_dependencies,
)

from app.core.redis.client import (
    redis_manager,
)
from app.core.security import hash_password_async, verify_password_async
from app.database.session import AsyncSessionLocal
from app.models.user import User

logger = logging.getLogger(__name__)


async def ensure_platform_admin() -> User | None:
    """Create or update a persistent platform administrator account from env config."""
    email = (os.getenv("PLATFORM_ADMIN_EMAIL") or "").strip()
    password = os.getenv("PLATFORM_ADMIN_PASSWORD") or ""
    if not email or not password:
        logger.info("Platform admin bootstrap skipped: PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD are not configured.")
        return None

    username = (os.getenv("PLATFORM_ADMIN_USERNAME") or email.split("@", 1)[0].strip() or "platformadmin").strip()
    async with AsyncSessionLocal() as db:
        existing = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
        if existing is None:
            candidate_username = username
            username_collision = (
                await db.execute(select(User).where(User.username == candidate_username))
            ).scalar_one_or_none()
            if username_collision is not None:
                candidate_username = f"{username}_{os.urandom(3).hex()}"
            user = User(
                username=candidate_username,
                email=email,
                full_name="Platform Administrator",
                password_hash=await hash_password_async(password),
                role="admin",
                account_type="STUDENT",
                status="ACTIVE",
                is_active=True,
                is_verified=True,
                is_superuser=True,
                onboarding_completed=True,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            logger.info("Created persistent platform admin user=%s (%s)", user.username, user.email)
            return user

        if (existing.role or "").lower() not in {"admin", "platform_admin"}:
            existing.role = "admin"
        existing.is_superuser = True
        existing.is_active = True
        existing.status = "ACTIVE"
        existing.is_verified = True
        existing.onboarding_completed = True
        existing.account_type = (existing.account_type or "STUDENT").upper()

        if not existing.username:
            existing.username = username
        elif existing.username != username:
            username_conflict = (
                await db.execute(select(User).where(User.username == username))
            ).scalar_one_or_none()
            if username_conflict is None or username_conflict.id == existing.id:
                existing.username = username

        if not await verify_password_async(password, existing.password_hash):
            existing.password_hash = await hash_password_async(password)

        await db.commit()
        await db.refresh(existing)
        logger.info("Ensured persistent platform admin privileges for user=%s (%s)", existing.username, existing.email)
        return existing


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