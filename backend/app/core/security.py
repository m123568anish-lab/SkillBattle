"""
=========================================================

SkillBattle

Security Utilities

=========================================================
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Annotated

from jose import JWTError, jwt
from passlib.context import CryptContext

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.database import get_db
from app.models.user import User

# =========================================================
# Password Hashing (use Argon2 via passlib)
# =========================================================

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# =========================================================
# OAuth2
# =========================================================

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
)

# =========================================================
# Password Helpers
# =========================================================


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# =========================================================
# JWT Creation
# =========================================================


def _create_token(
    user_id: str,
    expires_delta: timedelta,
    token_type: str,
) -> str:

    now = datetime.now(timezone.utc)

    payload = {
        "sub": user_id,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def create_access_token(
    user_id: str,
) -> str:

    return _create_token(
        user_id=user_id,
        expires_delta=timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        ),
        token_type="access",
    )


def create_refresh_token(
    user_id: str,
) -> str:

    return _create_token(
        user_id=user_id,
        expires_delta=timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS,
        ),
        token_type="refresh",
    )


# =========================================================
# Decode JWT
# =========================================================


def decode_token(
    token: str,
) -> dict:

    try:

        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        return payload

    except JWTError:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


# =========================================================
# Current User Dependency
# =========================================================


def get_current_user(
    token: Annotated[
        str,
        Depends(oauth2_scheme),
    ],
    db: Session = Depends(get_db),
) -> User:

    payload = decode_token(token)

    user_id = payload.get("sub")

    if not user_id:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


# =========================================================
# Optional Helpers
# =========================================================


def get_user_id(token: str) -> str:

    payload = decode_token(token)

    return payload["sub"]


def is_access_token(token: str) -> bool:

    payload = decode_token(token)

    return payload.get("type") == "access"


def is_refresh_token(token: str) -> bool:

    payload = decode_token(token)

    return payload.get("type") == "refresh"