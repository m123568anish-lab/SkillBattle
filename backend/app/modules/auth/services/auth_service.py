"""
=========================================================

SkillBattle

Authentication Service

Business logic for authentication.

=========================================================
"""

from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)

from app.models.refresh_token import RefreshToken
from app.models.user import User

from app.modules.auth.repositories.user_repository import (
    user_repository,
)

from app.modules.auth.schemas.requests import (
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
)


class AuthService:

    # --------------------------------------------------

    async def register(

        self,

        db: AsyncSession,

        request: RegisterRequest,

    ) -> User:

        existing_email = await user_repository.get_by_email(

            db,

            request.email,

        )

        if existing_email:

            raise ValueError(

                "Email already registered."

            )

        existing_username = await user_repository.get_by_username(

            db,

            request.username,

        )

        if existing_username:

            raise ValueError(

                "Username already exists."

            )

        user = User(

            username=request.username,

            email=request.email,

            full_name=request.full_name,

            password_hash=hash_password(

                request.password,

            ),

            role="user",

        )

        return await user_repository.create_user(

            db,

            user,

        )

    # --------------------------------------------------

    async def login(

        self,

        db: AsyncSession,

        request: LoginRequest,

        device_name: str | None = None,

        device_os: str | None = None,

        browser: str | None = None,

        ip_address: str | None = None,

        user_agent: str | None = None,

    ) -> dict:

        user = await user_repository.get_by_email(

            db,

            request.email,

        )

        if user is None:

            raise ValueError(

                "Invalid email or password."

            )

        if not verify_password(

            request.password,

            user.password_hash,

        ):

            raise ValueError(

                "Invalid email or password."

            )

        if not user.is_active:

            raise ValueError(

                "User account is disabled."

            )

        access_token = create_access_token(

            user.id,

        )

        refresh_token = create_refresh_token(

            user.id,

        )

        token = RefreshToken(

            user_id=user.id,

            token=refresh_token,

            device_name=device_name,

            device_os=device_os,

            browser=browser,

            ip_address=ip_address,

            user_agent=user_agent,

            expires_at=datetime.utcnow()

            + timedelta(

                days=settings.REFRESH_TOKEN_EXPIRE_DAYS,

            ),

        )

        await user_repository.save_refresh_token(

            db,

            token,

        )

        await user_repository.update_login(

            db,

            user,

        )

        return {

            "user": user,

            "access_token": access_token,

            "refresh_token": refresh_token,

            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,

        }

    # --------------------------------------------------

    async def refresh_access_token(

        self,

        db: AsyncSession,

        refresh_token: str,

    ) -> dict:

        stored = await user_repository.get_refresh_token(

            db,

            refresh_token,

        )

        if stored is None:

            raise ValueError(

                "Refresh token not found."

            )

        if stored.revoked:

            raise ValueError(

                "Refresh token revoked."

            )

        if stored.expired:

            raise ValueError(

                "Refresh token expired."

            )

        stored.last_used_at = datetime.utcnow()

        await db.commit()

        access = create_access_token(

            stored.user_id,

        )

        return {

            "access_token": access,

            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,

        }

    # --------------------------------------------------

    async def logout(

        self,

        db: AsyncSession,

        refresh_token: str,

    ) -> bool:

        return await user_repository.revoke_refresh_token(

            db,

            refresh_token,

        )

    # --------------------------------------------------

    async def logout_all_devices(

        self,

        db: AsyncSession,

        user_id: str,

    ) -> int:

        return await user_repository.revoke_all_user_tokens(

            db,

            user_id,

        )

    # --------------------------------------------------

    async def change_password(

        self,

        db: AsyncSession,

        user: User,

        request: ChangePasswordRequest,

    ) -> User:

        if not verify_password(

            request.current_password,

            user.password_hash,

        ):

            raise ValueError(

                "Current password is incorrect."

            )

        user.password_hash = hash_password(

            request.new_password,

        )

        return await user_repository.update_user(

            db,

            user,

        )

    # --------------------------------------------------

    async def verify_email(

        self,

        db: AsyncSession,

        user: User,

    ) -> User:

        user.is_verified = True

        return await user_repository.update_user(

            db,

            user,

        )


auth_service = AuthService()