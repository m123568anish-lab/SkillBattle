from __future__ import annotations

import logging
import os
from typing import Final

from sqlalchemy import select

from app.core.security import hash_password_async
from app.database.session import AsyncSessionLocal
from app.models.user import User

logger = logging.getLogger(__name__)

PLATFORM_ADMIN_ROLE: Final[str] = "PLATFORM_ADMIN"
PLATFORM_ADMIN_ACCOUNT_TYPE: Final[str] = "PLATFORM_ADMIN"


def _assert_non_production() -> None:
    environment = (os.getenv("ENVIRONMENT") or "development").strip().casefold()
    if environment in {"production", "prod"}:
        raise RuntimeError("Admin bootstrap is disabled in production.")
    if environment not in {"development", "dev", "staging", "stage", "test", "testing"}:
        raise RuntimeError("Admin bootstrap requires a development, staging, or test environment.")


async def create_platform_admin(
    *,
    email: str,
    password: str,
    username: str,
    full_name: str = "Qubira Admin Test Account",
) -> tuple[User, bool]:
    """Create or reuse one platform admin without changing existing users.

    Returns ``(user, created)``. The caller owns displaying a newly generated
    password; this module never logs credentials.
    """
    _assert_non_production()
    email = email.strip().lower()
    username = username.strip()
    if not email or not password or not username:
        raise ValueError("email, password, and username are required")

    async with AsyncSessionLocal() as db:
        existing = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
        if existing is not None:
            existing_role = (existing.role or "").strip().upper()
            existing_account_type = (existing.account_type or "").strip().upper()
            if existing_role not in {"ADMIN", PLATFORM_ADMIN_ROLE} and not existing.is_superuser:
                raise ValueError(
                    f"Configured admin email '{email}' already exists for a non-admin account; no user was changed."
                )
            if existing_account_type not in {"", "ADMIN", PLATFORM_ADMIN_ACCOUNT_TYPE} and not existing.is_superuser:
                raise ValueError(
                    f"Configured admin email '{email}' has a non-admin account type; no user was changed."
                )
            return existing, False

        username_collision = (
            await db.execute(select(User).where(User.username == username))
        ).scalar_one_or_none()
        if username_collision is not None:
            raise ValueError(f"Username '{username}' is already in use; no user was changed.")

        user = User(
            username=username,
            email=email,
            full_name=full_name,
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
        return user, True


async def ensure_platform_admin() -> User | None:
    """Backward-compatible explicit bootstrap using configured secret values.

    This function is intentionally not called by application startup.
    """
    _assert_non_production()
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

    user, _ = await create_platform_admin(
        email=email,
        password=password,
        username=username,
        full_name="Platform Administrator",
    )
    logger.info("Verified persistent platform admin account.")
    return user
