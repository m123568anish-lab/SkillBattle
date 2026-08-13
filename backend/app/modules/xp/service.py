"""
=========================================================

SkillBattle

XP Service

Production Async Version

=========================================================
"""

from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.xp import XP

from app.modules.xp.repository import (
    xp_repository,
)

logger = logging.getLogger(__name__)


class XPService:

    # =====================================================
    # Get User XP
    # =====================================================

    async def get_user_xp(
        self,
        db: AsyncSession,
        current_user: User,
    ) -> XP:

        xp = await xp_repository.get_by_user(

            db,

            current_user.id,

        )

        if xp:

            return xp

        xp = XP(

            user_id=current_user.id,

            total_xp=0,

            weekly_xp=0,

            daily_xp=0,

            level=1,

            rank=999999,

        )

        xp = await xp_repository.create(

            db,

            xp,

        )

        await xp_repository.commit(db)

        logger.info(

            "Created XP profile for user %s",

            current_user.id,

        )

        return xp

    # =====================================================
    # Add XP
    # =====================================================

    async def add_xp(
        self,
        db: AsyncSession,
        current_user: User,
        amount: int,
    ) -> XP:

        xp = await self.get_user_xp(

            db,

            current_user,

        )

        xp.total_xp += amount
        xp.weekly_xp += amount
        xp.daily_xp += amount

        xp.level = (xp.total_xp // 500) + 1

        xp = await xp_repository.update(

            db,

            xp,

        )

        await xp_repository.commit(db)

        logger.info(

            "Added %s XP to user %s",

            amount,

            current_user.id,

        )

        return xp

    # =====================================================
    # Remove XP
    # =====================================================

    async def remove_xp(
        self,
        db: AsyncSession,
        current_user: User,
        amount: int,
    ) -> XP:

        xp = await self.get_user_xp(

            db,

            current_user,

        )

        xp.total_xp = max(

            0,

            xp.total_xp - amount,

        )

        xp.level = max(

            1,

            (xp.total_xp // 500) + 1,

        )

        xp = await xp_repository.update(

            db,

            xp,

        )

        await xp_repository.commit(db)

        return xp


xp_service = XPService()