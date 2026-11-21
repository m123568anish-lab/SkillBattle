"""
=========================================================

JWT Manager
Token generation and type-enforced validation.

=========================================================
"""

from __future__ import annotations

from datetime import datetime
from datetime import timedelta
from datetime import timezone
from typing import Any

try:
    import jwt as jwt_lib
except ModuleNotFoundError:  # pragma: no cover - fallback for environments with python-jose
    from jose import jwt as jwt_lib

from app.core.config import settings


class JWTManager:

    ACCESS_MINUTES = 60

    REFRESH_DAYS = 30

    # =====================================================
    # Access Token
    # =====================================================

    def create_access_token(
        self,
        user_id: str,
        extra_claims: dict[str, Any] | None = None,
    ) -> str:

        payload = {
            "sub": str(user_id),
            "type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
            "iat": datetime.now(timezone.utc),
        }
        if extra_claims:
            payload.update(extra_claims)

        return jwt_lib.encode(
            payload,
            settings.SECRET_KEY,
            algorithm="HS256",
        )

    # =====================================================
    # Refresh Token
    # =====================================================

    def create_refresh_token(
        self,
        user_id: str,
    ) -> str:

        import secrets

        payload = {
            "sub": str(user_id),
            "type": "refresh",
            "jti": secrets.token_hex(16),
            "exp": datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            "iat": datetime.now(timezone.utc),
        }

        return jwt_lib.encode(
            payload,
            settings.SECRET_KEY,
            algorithm="HS256",
        )

    # =====================================================
    # Decode & Validate Token
    # =====================================================

    def decode(
        self,
        token: str,
        expected_type: str | None = None,
    ) -> dict[str, Any]:
        """
        Decode and validate JWT.
        If expected_type is provided (e.g. 'access' or 'refresh'),
        raises ValueError if token type does not match.
        """
        payload = jwt_lib.decode(
            token,
            settings.SECRET_KEY,
            algorithms=["HS256"],
        )

        if expected_type is not None:
            token_type = payload.get("type")
            if token_type != expected_type:
                raise ValueError(
                    f"Invalid token type: expected {expected_type!r}, got {token_type!r}"
                )

        return payload

    def verify_access_token(self, token: str) -> dict[str, Any]:
        """Validate token strictly as an access token."""
        return self.decode(token, expected_type="access")

    def verify_refresh_token(self, token: str) -> dict[str, Any]:
        """Validate token strictly as a refresh token."""
        return self.decode(token, expected_type="refresh")


jwt_manager = JWTManager()
