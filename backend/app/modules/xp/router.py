"""
=========================================================

SkillBattle

XP Router

Production Async Version

=========================================================
"""

from __future__ import annotations

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import (
    get_db,
)

from app.core.dependencies import (
    get_current_user,
)

from app.models.user import User

from app.modules.xp.schemas import (
    XPResponse,
    AddXPRequest,
)

from app.modules.xp.service import (
    xp_service,
)

router = APIRouter(

    prefix="/xp",

    tags=["XP"],

)


# ==========================================================
# Health
# ==========================================================

@router.get(
    "/health",
)
async def health():

    return {

        "module": "xp",

        "status": "healthy",

    }


# ==========================================================
# Get XP
# ==========================================================

@router.get(
    "",
    response_model=XPResponse,
)
async def get_xp(

    db: AsyncSession = Depends(
        get_db,
    ),

    current_user: User = Depends(
        get_current_user,
    ),

):

    return await xp_service.get_user_xp(

        db,

        current_user,

    )


# ==========================================================
# Add XP
# ==========================================================

@router.post(
    "/add",
    response_model=XPResponse,
)
async def add_xp(

    request: AddXPRequest,

    db: AsyncSession = Depends(
        get_db,
    ),

    current_user: User = Depends(
        get_current_user,
    ),

):

    try:

        return await xp_service.add_xp(

            db,

            current_user,

            request.amount,

        )

    except Exception as exc:

        raise HTTPException(

            status_code=status.HTTP_400_BAD_REQUEST,

            detail=str(exc),

        )


# ==========================================================
# Remove XP
# ==========================================================

@router.post(
    "/remove",
    response_model=XPResponse,
)
async def remove_xp(

    request: AddXPRequest,

    db: AsyncSession = Depends(
        get_db,
    ),

    current_user: User = Depends(
        get_current_user,
    ),

):

    try:

        return await xp_service.remove_xp(

            db,

            current_user,

            request.amount,

        )

    except Exception as exc:

        raise HTTPException(

            status_code=status.HTTP_400_BAD_REQUEST,

            detail=str(exc),

        )