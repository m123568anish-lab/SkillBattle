"""
=========================================================

SkillBattle

Streak Service

Production Async Version with Authoritative Activity Ledger

=========================================================
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta
from typing import Any

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.models.streak import Streak, UserDailyActivity
from app.models.user import User

logger = logging.getLogger(__name__)


class StreakService:
    """
    Authoritative streak service.
    Streaks are driven strictly by verified backend qualifying activities (problems solved,
    battles completed, daily practice finished, or scored assessments).
    """

    async def get_streak(
        self,
        db: AsyncSession,
        user_id: str,
    ) -> dict[str, Any]:
        """
        Retrieve user streak with authoritative expiration logic.
        If last qualifying activity was before yesterday (missed days), current streak is 0.
        """
        user_id_str = str(user_id)
        stmt = select(Streak).where(Streak.user_id == user_id_str)
        streak = (await db.execute(stmt)).scalar_one_or_none()

        today = datetime.utcnow().date()
        yesterday = today - timedelta(days=1)

        if not streak:
            return {
                "current_streak": 0,
                "best_streak": 0,
                "last_active": datetime.utcnow(),
                "is_active_today": False,
            }

        last_date = streak.last_activity_date or (
            streak.last_active.date() if streak.last_active else None
        )

        is_active_today = last_date == today
        is_active_yesterday = last_date == yesterday

        if is_active_today or is_active_yesterday:
            effective_streak = streak.current_streak
        else:
            # Missed at least one calendar day
            effective_streak = 0

        return {
            "current_streak": effective_streak,
            "best_streak": streak.best_streak,
            "last_active": streak.last_active,
            "last_activity_date": last_date.isoformat() if last_date else None,
            "is_active_today": is_active_today,
        }

    async def record_activity(
        self,
        db: AsyncSession,
        user_id: str,
        activity_type: str = "practice",
        reference_id: str | None = None,
        xp_earned: int = 0,
        activity_date: date | None = None,
        *,
        commit: bool = False,
    ) -> tuple[int, int]:
        """
        Record a verified qualifying activity event and update streak atomically.
        Guarantees that activity is counted at most once per user per local calendar day.
        Returns (current_streak, best_streak).
        """
        user_id_str = str(user_id)
        target_date = activity_date or datetime.utcnow().date()
        now = datetime.utcnow()

        # 1. Idempotently record daily activity
        stmt_act = select(UserDailyActivity).where(
            UserDailyActivity.user_id == user_id_str,
            UserDailyActivity.activity_date == target_date,
        )
        existing_act = (await db.execute(stmt_act)).scalar_one_or_none()

        if existing_act is None:
            new_act = UserDailyActivity(
                user_id=user_id_str,
                activity_date=target_date,
                activity_type=activity_type,
                reference_id=str(reference_id) if reference_id is not None else None,
                xp_earned=xp_earned,
                created_at=now,
            )
            db.add(new_act)
            await db.flush()
        else:
            if xp_earned > 0 and existing_act.xp_earned == 0:
                existing_act.xp_earned = xp_earned

        # 2. Update Streak summary with row locking
        stmt_streak = (
            select(Streak)
            .where(Streak.user_id == user_id_str)
            .with_for_update()
        )
        streak = (await db.execute(stmt_streak)).scalar_one_or_none()

        yesterday = target_date - timedelta(days=1)

        if streak is None:
            streak = Streak(
                user_id=user_id_str,
                current_streak=1,
                best_streak=1,
                last_active=now,
                last_activity_date=target_date,
            )
            db.add(streak)
        else:
            last_date = streak.last_activity_date or (
                streak.last_active.date() if streak.last_active else None
            )

            if last_date == target_date:
                # Already recorded qualifying activity for this calendar date
                streak.last_active = now
            elif last_date == yesterday:
                # Consecutive day: extend current streak
                streak.current_streak += 1
                streak.best_streak = max(streak.best_streak, streak.current_streak)
                streak.last_activity_date = target_date
                streak.last_active = now
            else:
                # Break in streak (missed days or first recorded activity)
                streak.current_streak = 1
                streak.best_streak = max(streak.best_streak, 1)
                streak.last_activity_date = target_date
                streak.last_active = now

        await db.flush()
        if commit:
            await db.commit()
            await db.refresh(streak)

        logger.info(
            "Recorded activity for user %s | type=%s date=%s streak=%s best=%s",
            user_id_str,
            activity_type,
            target_date,
            streak.current_streak,
            streak.best_streak,
        )
        return streak.current_streak, streak.best_streak

    async def get_activity_history(
        self,
        db: AsyncSession,
        user_id: str,
        days: int = 84,
    ) -> list[dict[str, Any]]:
        """Retrieve daily activity records for consistency heatmaps."""
        user_id_str = str(user_id)
        since_date = datetime.utcnow().date() - timedelta(days=days)
        stmt = (
            select(UserDailyActivity)
            .where(
                UserDailyActivity.user_id == user_id_str,
                UserDailyActivity.activity_date >= since_date,
            )
            .order_by(UserDailyActivity.activity_date.asc())
        )
        records = (await db.execute(stmt)).scalars().all()
        return [
            {
                "date": r.activity_date.isoformat(),
                "activity_type": r.activity_type,
                "xp_earned": r.xp_earned,
            }
            for r in records
        ]

    async def reconcile_streak(
        self,
        db: AsyncSession,
        user_id: str,
        *,
        commit: bool = True,
    ) -> tuple[int, int]:
        """
        Reconstruct streak from canonical UserDailyActivity records.
        Useful for audits, data migrations, or recovering from out-of-order writes.
        """
        user_id_str = str(user_id)
        stmt = (
            select(UserDailyActivity.activity_date)
            .where(UserDailyActivity.user_id == user_id_str)
            .order_by(UserDailyActivity.activity_date.asc())
        )
        dates = [row[0] for row in (await db.execute(stmt)).all()]

        if not dates:
            # Check XPLedger as fallback
            from app.models.xp import XPLedger
            stmt_ledger = (
                select(func.date(XPLedger.created_at))
                .where(XPLedger.user_id == user_id_str)
                .group_by(func.date(XPLedger.created_at))
                .order_by(func.date(XPLedger.created_at).asc())
            )
            ledger_dates = (await db.execute(stmt_ledger)).scalars().all()
            dates = [d if isinstance(d, date) else datetime.strptime(str(d)[:10], "%Y-%m-%d").date() for d in ledger_dates if d]

        if not dates:
            return 0, 0

        # Calculate longest and current streak from unique sorted dates
        unique_dates = sorted(set(dates))
        best_streak = 0
        current_run = 0
        prev_date: date | None = None

        for d in unique_dates:
            if prev_date is None or d == prev_date + timedelta(days=1):
                current_run += 1
            else:
                current_run = 1
            best_streak = max(best_streak, current_run)
            prev_date = d

        today = datetime.utcnow().date()
        yesterday = today - timedelta(days=1)
        last_date = unique_dates[-1]

        if last_date in (today, yesterday):
            current_streak = current_run
        else:
            current_streak = 0

        # Persist reconciled streak
        stmt_streak = (
            select(Streak)
            .where(Streak.user_id == user_id_str)
            .with_for_update()
        )
        streak = (await db.execute(stmt_streak)).scalar_one_or_none()

        if streak is None:
            streak = Streak(
                user_id=user_id_str,
                current_streak=current_streak,
                best_streak=best_streak,
                last_active=datetime.utcnow(),
                last_activity_date=last_date,
            )
            db.add(streak)
        else:
            streak.current_streak = current_streak
            streak.best_streak = max(streak.best_streak, best_streak)
            streak.last_activity_date = last_date
            streak.last_active = datetime.utcnow()

        await db.flush()
        if commit:
            await db.commit()

        return current_streak, streak.best_streak

    # Synchronous wrappers for backwards compatibility
    def get_streak_sync(self, db: Session, current_user: User) -> Streak:
        from app.models.streak import Streak
        streak = db.query(Streak).filter(Streak.user_id == str(current_user.id)).first()
        if not streak:
            streak = Streak(
                user_id=str(current_user.id),
                current_streak=0,
                best_streak=0,
                last_active=datetime.utcnow(),
            )
            db.add(streak)
            db.commit()
            db.refresh(streak)
        return streak

    def update_streak_sync(self, db: Session, current_user: User) -> Streak:
        streak = self.get_streak_sync(db, current_user)
        now = datetime.utcnow()
        today = now.date()
        yesterday = today - timedelta(days=1)
        last_date = streak.last_activity_date or streak.last_active.date()

        if last_date == today:
            pass
        elif last_date == yesterday:
            streak.current_streak += 1
            streak.best_streak = max(streak.best_streak, streak.current_streak)
            streak.last_activity_date = today
        else:
            streak.current_streak = 1
            streak.best_streak = max(streak.best_streak, 1)
            streak.last_activity_date = today

        streak.last_active = now
        db.commit()
        db.refresh(streak)
        return streak


streak_service = StreakService()
