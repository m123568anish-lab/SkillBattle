"""
=========================================================

SkillBattle

Tournament Router

Production Version

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

from app.modules.tournament.schemas import (
    CreateTournamentRequest,
    JoinTournamentRequest,
)

from app.modules.tournament.service import (
    tournament_service,
)

router = APIRouter(

    prefix="/tournament",

    tags=["Tournament"],

)


# ==========================================================
# Health
# ==========================================================

@router.get(
    "/health",
)
async def health():

    return {

        "module": "tournament",

        "status": "healthy",

    }


# ==========================================================
# Create Tournament
# ==========================================================

@router.post(
    "/create",
)
async def create_tournament(

    request: CreateTournamentRequest,

    db: AsyncSession = Depends(get_db),

):

    try:

        return await tournament_service.create_tournament(

            db,

            request,

        )

    except Exception as exc:

        raise HTTPException(

            status_code=status.HTTP_400_BAD_REQUEST,

            detail=str(exc),

        )


# ==========================================================
# Join Tournament
# ==========================================================

@router.post(
    "/join",
)
async def join_tournament(

    request: JoinTournamentRequest,

    db: AsyncSession = Depends(get_db),

    current_user: User = Depends(
        get_current_user,
    ),

):

    try:

        return await tournament_service.join_tournament(

            db,

            request.tournament_id,

            current_user,

        )

    except Exception as exc:

        raise HTTPException(

            status_code=status.HTTP_400_BAD_REQUEST,

            detail=str(exc),

        )


# ==========================================================
# Leave Tournament
# ==========================================================

@router.post(
    "/leave",
)
async def leave_tournament(

    request: JoinTournamentRequest,

    db: AsyncSession = Depends(get_db),

    current_user: User = Depends(
        get_current_user,
    ),

):

    return await tournament_service.leave_tournament(

        db,

        request.tournament_id,

        current_user,

    )


# ==========================================================
# List Tournaments
# ==========================================================

@router.get(
    "",
)
async def tournaments(

    db: AsyncSession = Depends(
        get_db,
    ),

):

    return await tournament_service.list_tournaments(

        db,

    )


# ==========================================================
# Tournament Details
# ==========================================================

@router.get(
    "/{tournament_id}",
)
async def tournament(

    tournament_id: str,

    db: AsyncSession = Depends(
        get_db,
    ),

):

    tournament = await tournament_service.get_tournament(

        db,

        tournament_id,

    )

    if tournament is None:

        raise HTTPException(

            status_code=404,

            detail="Tournament not found.",

        )

    return tournament


# ==========================================================
# Participants
# ==========================================================

@router.get(
    "/{tournament_id}/participants",
)
async def participants(

    tournament_id: str,

    db: AsyncSession = Depends(
        get_db,
    ),

):

    return await tournament_service.participants(

        db,

        tournament_id,

    )


# ==========================================================
# Start Tournament
# ==========================================================

@router.post(
    "/{tournament_id}/start",
)
async def start(

    tournament_id: str,

    db: AsyncSession = Depends(
        get_db,
    ),

):

    return await tournament_service.start_tournament(

        db,

        tournament_id,

    )


# ==========================================================
# Advance Tournament
# ==========================================================

@router.post(
    "/{tournament_id}/advance",
)
async def advance(

    tournament_id: str,

    db: AsyncSession = Depends(
        get_db,
    ),

):

    return await tournament_service.advance_round(

        db,

        tournament_id,

    )


# ==========================================================
# Finish Tournament
# ==========================================================

@router.post(
    "/{tournament_id}/finish",
)
async def finish(

    tournament_id: str,

    db: AsyncSession = Depends(
        get_db,
    ),

):

    return await tournament_service.finish_tournament(

        db,

        tournament_id,

    )