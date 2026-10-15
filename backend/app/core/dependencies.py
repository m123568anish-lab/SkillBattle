"""
=========================================================

SkillBattle

Authentication Dependencies

Shared authentication and authorization
dependencies for FastAPI.

=========================================================
"""

from __future__ import annotations

import re
import secrets

from fastapi import Depends
from fastapi import HTTPException
from fastapi import status

from fastapi.security import OAuth2PasswordBearer

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    ClerkAuthenticationError,
    decode_token,
    get_clerk_user_profile,
    hash_password_async,
    verify_clerk_token,
)

from app.database.session import get_db

from app.modules.auth.repositories.user_repository import (
    user_repository,
)

from app.models.user import User


oauth2_scheme = OAuth2PasswordBearer(

    tokenUrl="/auth/login",

)
optional_oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
    auto_error=False,
)


# ==========================================================
# Current User
# ==========================================================

async def _get_or_create_clerk_user(
    db: AsyncSession,
    claims: dict,
) -> User:
    """Link a verified Clerk subject to a local application user."""
    clerk_user_id = claims["sub"]
    user = await user_repository.get_by_clerk_user_id(db, clerk_user_id)
    if user is not None:
        return user

    profile = await get_clerk_user_profile(clerk_user_id)
    profile_email = profile.get("email") if profile else None
    claim_email = claims.get("email")
    email = profile_email or (claim_email if isinstance(claim_email, str) else None)
    email_verified = bool(profile and profile.get("email_verified")) or claims.get("email_verified") is True

    if not email or not email_verified:
        raise ClerkAuthenticationError(
            "A verified Clerk email is required to link this SkillBattle account."
        )

    user = await user_repository.get_by_email(db, email)
    if user is not None:
        if user.clerk_user_id and user.clerk_user_id != clerk_user_id:
            raise ClerkAuthenticationError("The email is already linked to another Clerk identity.")
        user.clerk_user_id = clerk_user_id
        user.is_verified = True
        await db.commit()
        await db.refresh(user)
        return user

    metadata = profile.get("public_metadata", {}) if profile else {}
    account_type = str(metadata.get("account_type", "STUDENT")).upper()
    if account_type not in {"STUDENT", "COLLEGE", "COMPANY"}:
        account_type = "STUDENT"

    raw_name = " ".join(
        value.strip()
        for value in (
            (profile or {}).get("first_name", ""),
            (profile or {}).get("last_name", ""),
        )
        if value and value.strip()
    )
    full_name = raw_name or email.split("@", 1)[0]
    username_seed = (profile or {}).get("username") or email.split("@", 1)[0]
    username_seed = re.sub(r"[^A-Za-z0-9_]", "", username_seed) or "player"
    username = username_seed[:30]
    if len(username) < 3:
        username = f"{username}_usr"[:30]
    if await user_repository.get_by_username(db, username):
        username = f"{username[:24]}_{secrets.token_hex(3)}"[:30]

    user = User(
        clerk_user_id=clerk_user_id,
        username=username,
        email=email,
        full_name=full_name,
        # Clerk owns the password. A random Argon2 value keeps legacy account
        # code safe without creating a usable local password.
        password_hash=await hash_password_async(secrets.token_urlsafe(32)),
        role="student",
        account_type=account_type,
        status="ACTIVE" if account_type == "STUDENT" else "PENDING_VERIFICATION",
        requested_role=None if account_type == "STUDENT" else f"{account_type}_ADMIN",
        avatar_url=(profile or {}).get("image_url"),
        is_active=True,
        is_verified=True,
        onboarding_completed=False,
    )
    db.add(user)
    await db.flush()

    # Match the records created by the legacy registration flow so a newly
    # linked Clerk user can use dashboards immediately.
    from app.models.user_stats import UserSettings, UserStats
    from app.models.xp import XP

    db.add(UserStats(user_id=user.id, level=1, rating=1000, xp=0))
    db.add(UserSettings(user_id=user.id, theme="dark", language="python"))
    db.add(XP(user_id=user.id, total_xp=0, weekly_xp=0, daily_xp=0, level=1, rank=99999))
    await db.commit()
    await db.refresh(user)
    return user

async def get_current_user(

    token: str = Depends(oauth2_scheme),

    db: AsyncSession = Depends(get_db),

) -> User:

    user: User | None = None

    try:

        payload = decode_token(

            token,

        )

        if payload.get("type") != "access" or not payload.get("sub"):
            raise ValueError("Token is not an access token")
        user_id = payload["sub"]
        user = await user_repository.get_by_id(db, user_id)
    except Exception:
        try:
            claims = await verify_clerk_token(token)
            user = await _get_or_create_clerk_user(db, claims)
        except Exception as exc:
            if not isinstance(exc, ClerkAuthenticationError):
                # Do not expose profile-linking or provider details to callers.
                pass
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token.",
                headers={"WWW-Authenticate": "Bearer"},
            ) from exc

    if user is None:

        raise HTTPException(

            status_code=status.HTTP_401_UNAUTHORIZED,

            detail="User not found.",

        )

    status_value = (getattr(user, "status", "ACTIVE") or "ACTIVE").upper()
    if status_value in {"REJECTED", "SUSPENDED"}:
        details = {
            "REJECTED": "Account verification was rejected.",
            "SUSPENDED": "Account is suspended.",
        }
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=details.get(status_value, "Account is disabled."),
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled.",
        )

    return user


async def get_optional_current_user(
    token: str | None = Depends(optional_oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    if token is None:
        return None
    return await get_current_user(token, db)


# ==========================================================
# Verified User
# ==========================================================

async def get_current_verified_user(

    current_user: User = Depends(

        get_current_user,

    ),

) -> User:

    # Email verification is not a normal login gate. Verification status is
    # informational and should not block authenticated access unless a specific
    # flow explicitly requires it.
    return current_user


# ==========================================================
# Admin User
# ==========================================================

async def get_current_admin(

    current_user: User = Depends(

        get_current_user,

    ),

) -> User:

    role = (getattr(current_user, "role", "") or "").strip().lower()
    if current_user.is_superuser or role in {"admin", "platform_admin", "platform_support", "platform_analyst"}:
        return current_user

    raise HTTPException(

        status_code=status.HTTP_403_FORBIDDEN,

        detail="Administrator privileges required.",

    )


# ==========================================================
# Role Guard
# ==========================================================

def require_role(

    *roles: str,

):

    async def dependency(

        current_user: User = Depends(

            get_current_user,

        ),

    ) -> User:

        if current_user.role not in roles:

            raise HTTPException(

                status_code=status.HTTP_403_FORBIDDEN,

                detail="Insufficient permissions.",

            )

        return current_user

    return dependency
