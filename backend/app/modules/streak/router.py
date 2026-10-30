"""
=========================================================

SkillBattle

Streak Router

Production Async Version

=========================================================
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.modules.streak.schemas import StreakResponse
from app.modules.streak.service import streak_service

router = APIRouter(
    prefix="/streak",
    tags=["Streak"],
)


@router.get(
    "",
    response_model=StreakResponse,
)
async def get_streak(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    streak_data = await streak_service.get_streak(db, str(current_user.id))
    return StreakResponse(
        current_streak=streak_data["current_streak"],
        best_streak=streak_data["best_streak"],
        last_active=streak_data["last_active"],
        longest_streak=streak_data["best_streak"],
        is_active_today=streak_data.get("is_active_today", False),
    )


@router.post(
    "/reconcile",
    response_model=StreakResponse,
)
async def reconcile_streak(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reconcile and verify streak history from daily activity records."""
    current, best = await streak_service.reconcile_streak(db, str(current_user.id), commit=True)
    streak_data = await streak_service.get_streak(db, str(current_user.id))
    return StreakResponse(
        current_streak=current,
        best_streak=best,
        last_active=streak_data["last_active"],
        longest_streak=best,
        is_active_today=streak_data.get("is_active_today", False),
    )


@router.post(
    "/update",
    response_model=StreakResponse,
)
async def update_streak(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Safely retrieve current authoritative streak without client spoofing.
    Streaks are updated on backend activity completion.
    """
    streak_data = await streak_service.get_streak(db, str(current_user.id))
    return StreakResponse(
        current_streak=streak_data["current_streak"],
        best_streak=streak_data["best_streak"],
        last_active=streak_data["last_active"],
        longest_streak=streak_data["best_streak"],
        is_active_today=streak_data.get("is_active_today", False),
    )
