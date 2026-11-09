"""
=========================================================

SkillBattle

Authentication Router

=========================================================
"""

from __future__ import annotations

import logging
from datetime import datetime

from fastapi import APIRouter
from fastapi import Depends
from fastapi import Header
from fastapi import HTTPException
from fastapi import Request
from fastapi import status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy import func, select

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis.rate_limiter import rate_limiter
from app.database.session import get_db

from app.modules.auth.schemas.requests import (
    RegisterRequest,
    LoginRequest,
    RefreshTokenRequest,
    ChangePasswordRequest,
    TwoFactorSetupRequest,
    TwoFactorVerifyRequest,
    DeleteAccountRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    NeonIdentityLinkRequest,
)

from app.modules.auth.schemas.responses import (
    LoginResponse,
    MessageResponse,
    RefreshResponse,
    UserResponse,
)

from app.modules.auth.services.auth_service import auth_service
from app.modules.auth.repositories.user_repository import user_repository

from app.core.dependencies import get_current_user, oauth2_scheme
from app.core.security import (
    NeonAuthenticationConfigurationError,
    NeonAuthenticationError,
    verify_neon_token,
    verify_password_async,
)

from app.models.user import User
from app.models.refresh_token import RefreshToken

logger = logging.getLogger(__name__)

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
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        )
    except IntegrityError:
        await db.rollback()
        logger.exception("Registration write violated a database constraint")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with that email or username already exists.",
        )
    except SQLAlchemyError:
        await db.rollback()
        logger.exception("Registration database write failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The account could not be saved. Please try again.",
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

    http_request: Request,

    db: AsyncSession = Depends(get_db),

    user_agent: str | None = Header(default=None),

):

    try:

        result = await auth_service.login(

            db,

            request,

            user_agent=user_agent,

            ip_address=http_request.client.host if http_request.client else None,

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
        detail = str(exc)
        if detail == "Too many login attempts. Please try again later.":
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=detail,
            )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
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


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(request: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)) -> dict:
    await auth_service.request_password_reset(db, request)
    return {"message": "If an account matches that email, password reset instructions have been sent."}


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(request: ResetPasswordRequest, db: AsyncSession = Depends(get_db)) -> dict:
    try:
        await auth_service.reset_password(db, request)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return {"message": "Password reset successfully. Please sign in again."}

# ==========================================================
# Logout
# ==========================================================

@router.post(
    "/2fa/setup",
    response_model=dict,
)
async def setup_two_factor(
    request: TwoFactorSetupRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await auth_service.setup_two_factor(db, request.email, request.password)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))


@router.post(
    "/2fa/verify",
    response_model=dict,
)
async def verify_two_factor(
    request: TwoFactorVerifyRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await auth_service.verify_two_factor(db, request.email, request.code)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))


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


@router.post(
    "/neon/link",
    response_model=MessageResponse,
)
async def link_neon_identity(
    request: NeonIdentityLinkRequest,
    http_request: Request,
    neon_token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        claims = await verify_neon_token(neon_token)
    except NeonAuthenticationConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Neon Auth verification is not configured on the application API.",
        ) from exc
    except NeonAuthenticationError as exc:
        logger.warning("Neon identity-link token rejected: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Neon Auth session.",
        ) from exc

    email = claims.get("email")
    neon_user_id = claims.get("sub")
    if not isinstance(email, str) or not isinstance(neon_user_id, str) or not neon_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Neon Auth session is missing account information.",
        )
    normalized_email = email.strip().lower()
    client_ip = http_request.client.host if http_request.client else "unknown"
    if not await rate_limiter.allow(f"neon-link-ip:{client_ip}", 30, 900):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many account-link attempts. Please try again later.",
        )
    if not await rate_limiter.allow(f"neon-link-account:{normalized_email}", 5, 900):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many account-link attempts. Please try again later.",
        )

    result = await db.execute(
        select(User).where(func.lower(User.email) == normalized_email)
    )
    existing_user = result.scalar_one_or_none()
    if existing_user is None or not await verify_password_async(
        request.password,
        existing_user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to link this Neon account with the supplied Qubira credentials.",
        )

    if existing_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This Qubira account requires its existing two-factor sign-in before it can be linked.",
        )
    if not existing_user.is_active or (
        (existing_user.status or "").upper() in {"REJECTED", "SUSPENDED"}
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This Qubira account is not active.",
        )
    if existing_user.neon_user_id and existing_user.neon_user_id != neon_user_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This Qubira account is linked to a different Neon identity.",
        )

    linked_user = await user_repository.get_by_neon_user_id(db, neon_user_id)
    if linked_user is not None and linked_user.id != existing_user.id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This Neon identity is linked to a different Qubira account.",
        )

    existing_user.neon_user_id = neon_user_id
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This Neon identity is already linked to another Qubira account.",
        ) from exc

    return {"message": "Neon identity linked successfully."}


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


@router.get("/sessions")
async def list_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sessions = await user_repository.list_user_refresh_tokens(db, current_user.id)
    return [
        {
            "id": session.id,
            "device_name": session.device_name,
            "device_os": session.device_os,
            "browser": session.browser,
            "ip_address": session.ip_address,
            "user_agent": session.user_agent,
            "created_at": session.created_at.isoformat(),
            "last_used_at": session.last_used_at.isoformat() if session.last_used_at else None,
            "expires_at": session.expires_at.isoformat(),
            "revoked": session.revoked,
            "revoked_at": session.revoked_at.isoformat() if session.revoked_at else None,
            "active": session.active,
        }
        for session in sessions
    ]


@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.id == session_id,
            RefreshToken.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found.")
    if not session.revoked:
        session.revoked = True
        session.revoked_at = datetime.utcnow()
        session.revoke_reason = "revoked_by_user"
        await db.commit()
    return {"session_id": session.id, "revoked": True}


# ==========================================================
# Delete Account
# ==========================================================

@router.delete(
    "/account",
    response_model=MessageResponse,
)
async def delete_account(
    request: DeleteAccountRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Permanently delete the authenticated user's account and personal data."""
    try:
        await auth_service.delete_account(db, current_user, request)
        return {"message": "Account successfully and permanently deleted."}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Account deletion failed")
        raise HTTPException(status_code=500, detail="Failed to delete account. Please try again.")
