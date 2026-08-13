"""
=========================================================

SkillBattle

Authentication Router

=========================================================
"""

from __future__ import annotations

from fastapi import APIRouter
from fastapi import Depends
from fastapi import Header
from fastapi import HTTPException
from fastapi import status

from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db

from app.modules.auth.schemas.requests import (
    RegisterRequest,
    LoginRequest,
    RefreshTokenRequest,
    ChangePasswordRequest,
)

from app.modules.auth.schemas.responses import (
    LoginResponse,
    MessageResponse,
    RefreshResponse,
    UserResponse,
)

from app.modules.auth.services.auth_service import auth_service
from app.modules.auth.repositories.user_repository import user_repository

from app.core.dependencies import get_current_user

from app.models.user import User

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# ==========================================================
# Register
# ==========================================================

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(

    request: RegisterRequest,

    db: AsyncSession = Depends(get_db),

):

    try:
        user = await auth_service.register(
            db,
            request,
        )
        return user
    except ValueError as exc:
        # If the error is due to an existing email or username, retrieve the user and return it
        if "already" in str(exc).lower():
            # Try to fetch by email first
            existing_user = await user_repository.get_by_email(db, request.email)
            if existing_user is None:
                existing_user = await user_repository.get_by_username(db, request.username)
            if existing_user:
                return existing_user
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


# ==========================================================
# Login
# ==========================================================

@router.post(
    "/login",
    response_model=LoginResponse,
)
async def login(

    request: LoginRequest,

    db: AsyncSession = Depends(get_db),

    user_agent: str | None = Header(default=None),

):

    try:

        result = await auth_service.login(

            db,

            request,

            user_agent=user_agent,

        )

        return {

            "user": result["user"],

            "tokens": {

                "access_token": result["access_token"],

                "refresh_token": result["refresh_token"],

                "expires_in": result["expires_in"],

            },

        }

    except ValueError as exc:

        raise HTTPException(

            status_code=401,

            detail=str(exc),

        )


# ==========================================================
# Refresh
# ==========================================================

@router.post(
    "/refresh",
    response_model=RefreshResponse,
)
async def refresh(

    request: RefreshTokenRequest,

    db: AsyncSession = Depends(get_db),

):

    try:

        return await auth_service.refresh_access_token(

            db,

            request.refresh_token,

        )

    except ValueError as exc:

        raise HTTPException(

            status_code=401,

            detail=str(exc),

        )


# ==========================================================
# Logout
# ==========================================================

@router.post(
    "/logout",
    response_model=MessageResponse,
)
async def logout(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Logout a user by revoking the provided refresh token.

    Validates that the token exists and belongs to the authenticated user.
    Returns a success message on completion.
    """
    token_obj = await user_repository.get_refresh_token(db, request.refresh_token)
    if token_obj is None or token_obj.user_id != current_user.id:
        raise HTTPException(status_code=400, detail="Invalid refresh token.")
    await auth_service.logout(db, request.refresh_token)
    return {"message": "Successfully logged out."}


# ==========================================================
# Logout All Devices
# ==========================================================

@router.post(
    "/logout-all",
    response_model=MessageResponse,
)
async def logout_all(

    db: AsyncSession = Depends(get_db),

    current_user: User = Depends(

        get_current_user,

    ),

):

    await auth_service.logout_all_devices(

        db,

        current_user.id,

    )

    return {

        "message":

        "Logged out from all devices."

    }


# ==========================================================
# Current User
# ==========================================================

@router.get(
    "/me",
    response_model=UserResponse,
)
async def me(

    current_user: User = Depends(

        get_current_user,

    ),

):

    return current_user


# ==========================================================
# Change Password
# ==========================================================

@router.post(
    "/change-password",
    response_model=MessageResponse,
)
async def change_password(

    request: ChangePasswordRequest,

    db: AsyncSession = Depends(get_db),

    current_user: User = Depends(

        get_current_user,

    ),

):

    try:

        await auth_service.change_password(

            db,

            current_user,

            request,

        )

        return {

            "message":

            "Password updated successfully."

        }

    except ValueError as exc:

        raise HTTPException(

            status_code=400,

            detail=str(exc),

        )


# ==========================================================
# Health
# ==========================================================

@router.get("/health")
async def health():

    return {

        "module": "Authentication",

        "status": "healthy",

    }