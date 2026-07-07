"""
=========================================================

SkillBattle

Authentication API

=========================================================
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.schemas.user import (
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
    RefreshTokenRequest,
)

from app.services.auth_service import (
    create_user,
    authenticate_user,
    get_user_by_email,
)

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
)

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
def register(
    user: UserRegister,
    db: Session = Depends(get_db),
):

    existing = get_user_by_email(
        db,
        user.email,
    )

    if existing:

        raise HTTPException(
            status_code=400,
            detail="Email already exists",
        )

    return create_user(
        db,
        user,
    )


# ==========================================================
# Login
# ==========================================================

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    credentials: UserLogin,
    db: Session = Depends(get_db),
):

    user = authenticate_user(
        db,
        credentials.email,
        credentials.password,
    )

    if not user:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        user.id,
    )

    refresh_token = create_refresh_token(
        user.id,
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )


# ==========================================================
# Refresh Token
# ==========================================================

@router.post(
    "/refresh",
    response_model=TokenResponse,
)
def refresh(
    request: RefreshTokenRequest,
):

    payload = decode_token(
        request.refresh_token,
    )

    if payload.get("type") != "refresh":

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user_id = payload.get("sub")

    access_token = create_access_token(
        user_id,
    )

    refresh_token = create_refresh_token(
        user_id,
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )


# ==========================================================
# Current User
# ==========================================================

@router.get(
    "/me",
    response_model=UserResponse,
)
def me(
    current_user: User = Depends(
        get_current_user,
    ),
):

    return current_user


# ==========================================================
# Logout
# ==========================================================

@router.post(
    "/logout",
)
def logout():

    return {
        "message": "Logged out successfully"
    }