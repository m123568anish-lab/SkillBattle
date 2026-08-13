"""
=========================================================

SkillBattle

Achievement Service

Production Async Version

=========================================================
"""

from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User

from app.modules.achievements.repository import (
    achievement_repository,
)

logger = logging.getLogger(__name__)


class AchievementService:

    # =====================================================
    # Get User Achievements
    # =====================================================

    async def get_user_achievements(
        self,
        db: AsyncSession,
        current_user: User,
    ):

        return await achievement_repository.get_all(

            db,

            current_user.id,

        )


achievement_service = AchievementService()