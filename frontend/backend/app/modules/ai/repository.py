"""
=========================================================

SkillBattle

AI Repository

=========================================================
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class AIRepository:

    async def get_user(
        self,
        db: AsyncSession,
        user_id: str,
    ):

        result = await db.execute(

            select(User).where(

                User.id == user_id

            )

        )

        return result.scalar_one_or_none()


ai_repository = AIRepository()