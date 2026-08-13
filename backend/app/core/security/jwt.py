"""
=========================================================

JWT Manager

=========================================================
"""

from __future__ import annotations

from datetime import datetime
from datetime import timedelta
from datetime import timezone

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
    ) -> str:

        payload = {

            "sub": user_id,

            "type": "access",

            "exp": datetime.now(

                timezone.utc,

            ) + timedelta(

                minutes=self.ACCESS_MINUTES,

            ),

        }

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

        payload = {

            "sub": user_id,

            "type": "refresh",

            "exp": datetime.now(

                timezone.utc,

            ) + timedelta(

                days=self.REFRESH_DAYS,

            ),

        }

        return jwt_lib.encode(

            payload,

            settings.SECRET_KEY,

            algorithm="HS256",

        )

    # =====================================================
    # Decode Token
    # =====================================================

    def decode(
        self,
        token: str,
    ):

        return jwt_lib.decode(

            token,

            settings.SECRET_KEY,

            algorithms=["HS256"],

        )


jwt_manager = JWTManager()