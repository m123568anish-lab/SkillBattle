"""
=========================================================

SkillBattle

Leaderboard Router

=========================================================
"""

from __future__ import annotations

from fastapi import (
    APIRouter,
    Depends,
)

from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import (
    get_db,
)

from app.core.dependencies import (
    get_current_user,
)

from app.models.user import User

from .service import (
    leaderboard_service,
)

router = APIRouter(

    prefix="/leaderboard",

    tags=["Leaderboard"],

)


# ==========================================================
# Health
# ==========================================================

@router.get(
    "/health",
)
async def health():

    return {

        "status": "healthy",

        "module": "leaderboard",

    }


# ==========================================================
# Global Leaderboard
# ==========================================================

@router.get(
    "",
)
async def global_leaderboard(

    db: AsyncSession = Depends(
        get_db,
    ),

):

    return await leaderboard_service.get_global_leaderboard(
        db,
    )


# ==========================================================
# My Rank
# ==========================================================

@router.get(
    "/me",
)
async def my_rank(

    db: AsyncSession = Depends(
        get_db,
    ),

    current_user: User = Depends(
        get_current_user,
    ),

):

    return await leaderboard_service.my_rank(

        db,

        current_user,

    )