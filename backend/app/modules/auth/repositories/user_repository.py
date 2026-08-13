"""
=========================================================

SkillBattle

User Repository

Handles all database operations related to users.

=========================================================
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy import update
from sqlalchemy import delete

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.refresh_token import RefreshToken


class UserRepository:

    # --------------------------------------------------
    # User
    # --------------------------------------------------

    async def create_user(

        self,

        db: AsyncSession,

        user: User,

    ) -> User:

        db.add(user)

        await db.commit()

        await db.refresh(user)

        return user

    # --------------------------------------------------

    async def get_by_id(

        self,

        db: AsyncSession,

        user_id: str,

    ) -> User | None:

        result = await db.execute(

            select(User).where(

                User.id == user_id

            )

        )

        return result.scalar_one_or_none()

    # --------------------------------------------------

    async def get_by_email(

        self,

        db: AsyncSession,

        email: str,

    ) -> User | None:

        result = await db.execute(

            select(User).where(

                User.email == email

            )

        )

        return result.scalar_one_or_none()

    # --------------------------------------------------

    async def get_by_username(

        self,

        db: AsyncSession,

        username: str,

    ) -> User | None:

        result = await db.execute(

            select(User).where(

                User.username == username

            )

        )

        return result.scalar_one_or_none()

    # --------------------------------------------------

    async def update_login(

        self,

        db: AsyncSession,

        user: User,

    ) -> None:

        user.login_count += 1

        user.updated_at = datetime.utcnow()

        await db.commit()

    # --------------------------------------------------

    async def update_user(

        self,

        db: AsyncSession,

        user: User,

    ) -> User:

        await db.commit()

        await db.refresh(user)

        return user

    # --------------------------------------------------

    async def delete_user(

        self,

        db: AsyncSession,

        user_id: str,

    ) -> bool:

        result = await db.execute(

            delete(User).where(

                User.id == user_id

            )

        )

        await db.commit()

        return result.rowcount > 0

    # --------------------------------------------------
    # Refresh Tokens
    # --------------------------------------------------

    async def save_refresh_token(

        self,

        db: AsyncSession,

        token: RefreshToken,

    ) -> RefreshToken:

        db.add(token)

        await db.commit()

        await db.refresh(token)

        return token

    # --------------------------------------------------

    async def get_refresh_token(

        self,

        db: AsyncSession,

        token: str,

    ) -> RefreshToken | None:

        result = await db.execute(

            select(RefreshToken).where(

                RefreshToken.token == token

            )

        )

        return result.scalar_one_or_none()

    # --------------------------------------------------

    async def revoke_refresh_token(

        self,

        db: AsyncSession,

        token: str,

    ) -> bool:

        result = await db.execute(

            select(RefreshToken).where(

                RefreshToken.token == token

            )

        )

        refresh = result.scalar_one_or_none()

        if refresh is None:

            return False

        refresh.revoked = True

        refresh.revoked_at = datetime.utcnow()

        await db.commit()

        return True

    # --------------------------------------------------

    async def revoke_all_user_tokens(

        self,

        db: AsyncSession,

        user_id: str,

    ) -> int:

        result = await db.execute(

            select(RefreshToken).where(

                RefreshToken.user_id == user_id,

                RefreshToken.revoked.is_(False),

            )

        )

        tokens = result.scalars().all()

        for token in tokens:

            token.revoked = True

            token.revoked_at = datetime.utcnow()

        await db.commit()

        return len(tokens)


user_repository = UserRepository()