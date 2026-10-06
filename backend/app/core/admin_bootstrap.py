from __future__ import annotations

import logging
import os
from typing import Final

from sqlalchemy import select

from app.core.security import hash_password_async, verify_password_async
from app.database.session import AsyncSessionLocal
from app.models.user import User

logger = logging.getLogger(__name__)

PLATFORM_ADMIN_ROLE: Final[str] = "PLATFORM_ADMIN"
PLATFORM_ADMIN_ACCOUNT_TYPE: Final[str] = "PLATFORM_ADMIN"


async def ensure_platform_admin() -> User | None:
    """Create or reuse the canonical platform admin account from environment secrets."""
    email = (os.getenv("PLATFORM_ADMIN_EMAIL") or "").strip()
    password = (os.getenv("PLATFORM_ADMIN_PASSWORD") or "").strip()
    if not email or not password:
        logger.info(
            "Platform admin bootstrap skipped: PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD are not configured."
        )
        return None

    username = (
        os.getenv("PLATFORM_ADMIN_USERNAME")
        or email.split("@", 1)[0].strip()
        or "platformadmin"
    ).strip()

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
                role=PLATFORM_ADMIN_ROLE,
                account_type=PLATFORM_ADMIN_ACCOUNT_TYPE,
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

        existing_role = (existing.role or "").strip().upper()
        existing_account_type = (existing.account_type or "").strip().upper()
        if existing_role != PLATFORM_ADMIN_ROLE or existing_account_type != PLATFORM_ADMIN_ACCOUNT_TYPE:
            raise ValueError(
                f"Configured admin email '{email}' already exists for a non-platform-admin account and will not be promoted automatically."
            )

        existing.role = PLATFORM_ADMIN_ROLE
        existing.account_type = PLATFORM_ADMIN_ACCOUNT_TYPE
        existing.requested_role = None
        existing.is_superuser = True
        existing.is_active = True
        existing.status = "ACTIVE"
        existing.is_verified = True
        existing.onboarding_completed = True

        if not existing.username:
            existing.username = username
        elif existing.username != username:
            username_conflict = (
                await db.execute(select(User).where(User.username == username))
            ).scalar_one_or_none()
            if username_conflict is None or username_conflict.id == existing.id:
                existing.username = username

        try:
            password_matches = await verify_password_async(password, existing.password_hash)
        except Exception:
            password_matches = False

        if not password_matches:
            existing.password_hash = await hash_password_async(password)

        await db.commit()
        await db.refresh(existing)
        logger.info("Ensured persistent platform admin privileges for user=%s (%s)", existing.username, existing.email)
        return existing
