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
from sqlalchemy import select

from app.models.user import User
from app.models.xp import XP, XPLedger
from app.models.user_stats import UserStats

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
        *,
        commit: bool = True,
    ) -> XP:
        user_id = str(current_user.id)
        await db.execute(select(User.id).where(User.id == user_id).with_for_update())
        xp = await xp_repository.get_by_user(db, user_id)
        if xp is not None:
            return xp

        stats_result = await db.execute(
            select(UserStats).where(UserStats.user_id == user_id)
        )
        stats = stats_result.scalar_one_or_none()
        total_xp = int(stats.xp or 0) if stats else 0
        xp = XP(
            user_id=user_id,
            total_xp=total_xp,
            weekly_xp=0,
            daily_xp=0,
            level=max(1, total_xp // 500 + 1),
            rank=99999,
        )
        db.add(xp)
        await db.flush()
        if stats is None:
            stats = UserStats(
                user_id=user_id,
                level=xp.level,
                rating=max(0, current_user.coding_rating or 1000),
                xp=xp.total_xp,
            )
            db.add(stats)
        else:
            stats.xp = xp.total_xp
            stats.level = xp.level
        if commit:
            await db.commit()
        return xp

    # =====================================================
    # Add XP
    # =====================================================

    async def add_xp(
        self,
        db: AsyncSession,
        current_user: User,
        amount: int,
        *,
        commit: bool = True,
        reason: str | None = None,
        source: str = "general",
        reference_id: str | None = None,
        description: str | None = None,
    ) -> XP:
        if amount <= 0:
            raise ValueError("XP amount must be positive")

        user_id = str(current_user.id)
        # Idempotency check: if reference_id is provided, verify whether already awarded
        if reference_id is not None:
            existing_ledger_stmt = select(XPLedger).where(
                XPLedger.user_id == user_id,
                XPLedger.source == source,
                XPLedger.reference_id == str(reference_id),
            )
            existing_ledger = (await db.execute(existing_ledger_stmt)).scalar_one_or_none()
            if existing_ledger is not None:
                logger.info(
                    "Duplicate XP award skipped for user %s: source=%s, ref=%s",
                    user_id,
                    source,
                    reference_id,
                )
                return await self.get_user_xp(db, current_user, commit=False)

        xp = await self.get_user_xp(db, current_user, commit=False)
        xp.total_xp += amount
        xp.weekly_xp += amount
        xp.daily_xp += amount
        xp.level = max(1, xp.total_xp // 500 + 1)

        # Authoritative audit ledger entry
        ledger_entry = XPLedger(
            user_id=user_id,
            amount=amount,
            source=source,
            reference_id=str(reference_id) if reference_id is not None else None,
            description=description or reason,
        )
        db.add(ledger_entry)

        stats_result = await db.execute(
            select(UserStats)
            .where(UserStats.user_id == user_id)
            .with_for_update()
        )
        stats = stats_result.scalar_one_or_none()
        if stats is None:
            stats = UserStats(
                user_id=user_id,
                level=xp.level,
                rating=max(0, current_user.coding_rating or 1000),
                xp=xp.total_xp,
            )
            db.add(stats)
        else:
            stats.xp = xp.total_xp
            stats.level = xp.level

        await db.flush()
        if commit:
            await db.commit()
        logger.info(
            "Added %s verified XP to user %s (source=%s, ref=%s)",
            amount,
            user_id,
            source,
            reference_id,
        )
        return xp

    # Alias for award_xp
    award_xp = add_xp

    # =====================================================
    # Reconcile XP
    # =====================================================

    async def reconcile_xp(
        self,
        db: AsyncSession,
        current_user: User,
        *,
        commit: bool = True,
    ) -> XP:
        """
        Reconcile total XP and level from authoritative XPLedger.
        If ledger entries exist, total_xp is synchronized with the ledger sum
        (or preserved if total_xp is higher due to legacy balance before ledger introduction).
        """
        from sqlalchemy import func
        user_id = str(current_user.id)
        stmt = select(func.sum(XPLedger.amount)).where(XPLedger.user_id == user_id)
        ledger_total = (await db.execute(stmt)).scalar() or 0

        xp = await self.get_user_xp(db, current_user, commit=False)
        if ledger_total > xp.total_xp:
            xp.total_xp = ledger_total
            xp.level = max(1, xp.total_xp // 500 + 1)

        stats_result = await db.execute(
            select(UserStats).where(UserStats.user_id == user_id).with_for_update()
        )
        stats = stats_result.scalar_one_or_none()
        if stats is not None:
            stats.xp = xp.total_xp
            stats.level = xp.level

        await db.flush()
        if commit:
            await db.commit()
        return xp

    # =====================================================
    # Get Ledger History
    # =====================================================

    async def get_ledger(
        self,
        db: AsyncSession,
        current_user: User,
        *,
        limit: int = 50,
    ) -> list[XPLedger]:
        user_id = str(current_user.id)
        stmt = (
            select(XPLedger)
            .where(XPLedger.user_id == user_id)
            .order_by(XPLedger.created_at.desc())
            .limit(limit)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

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

        stats_result = await db.execute(
            select(UserStats).where(UserStats.user_id == current_user.id)
        )
        stats = stats_result.scalar_one_or_none()
        if stats is not None:
            stats.xp = xp.total_xp
            stats.level = xp.level

        await xp_repository.commit(db)

        return xp


xp_service = XPService()