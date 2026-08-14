"""
=========================================================

SkillBattle

Authentication Dependencies

Shared authentication and authorization
dependencies for FastAPI.

=========================================================
"""

from __future__ import annotations

from fastapi import Depends
from fastapi import HTTPException
from fastapi import status

from fastapi.security import OAuth2PasswordBearer

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    decode_token,
)

from app.database.session import get_db

from app.modules.auth.repositories.user_repository import (
    user_repository,
)

from app.models.user import User


oauth2_scheme = OAuth2PasswordBearer(

    tokenUrl="/auth/login",

)


# ==========================================================
# Current User
# ==========================================================

async def get_current_user(

    token: str = Depends(oauth2_scheme),

    db: AsyncSession = Depends(get_db),

) -> User:

    try:

        payload = decode_token(

            token,

        )

        user_id = payload["sub"]

    except Exception:

        raise HTTPException(

            status_code=status.HTTP_401_UNAUTHORIZED,

            detail="Invalid authentication token.",

            headers={

                "WWW-Authenticate": "Bearer",

            },

        )

    user = await user_repository.get_by_id(

        db,

        user_id,

    )

    if user is None:

        raise HTTPException(

            status_code=status.HTTP_401_UNAUTHORIZED,

            detail="User not found.",

        )

    if not user.is_active:

        raise HTTPException(

            status_code=status.HTTP_403_FORBIDDEN,

            detail="Account is disabled.",

        )

    return user


# ==========================================================
# Verified User
# ==========================================================

async def get_current_verified_user(

    current_user: User = Depends(

        get_current_user,

    ),

) -> User:

    if not current_user.is_verified:

        raise HTTPException(

            status_code=status.HTTP_403_FORBIDDEN,

            detail="Email is not verified.",

        )

    return current_user


# ==========================================================
# Admin User
# ==========================================================

async def get_current_admin(

    current_user: User = Depends(

        get_current_user,

    ),

) -> User:

    if not (current_user.is_superuser or getattr(current_user, "role", None) == "admin"):

        raise HTTPException(

            status_code=status.HTTP_403_FORBIDDEN,

            detail="Administrator privileges required.",

        )

    return current_user


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