"""
=========================================================

SkillBattle

Compiler Router

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

from app.database.session import get_db

from app.core.dependencies import (
    get_current_user,
)

from app.models.user import User

from app.modules.compiler.schemas import (
    RunCodeRequest,
    RunCodeResponse,
    SubmitCodeRequest,
    SubmitCodeResponse,
)

from app.modules.compiler.service import (
    compiler_service,
)

router = APIRouter(

    prefix="/compiler",

    tags=["Compiler"],

)


# ==========================================================
# Health
# ==========================================================

@router.get(
    "/health",
)
async def health():

    return await compiler_service.health()


# ==========================================================
# Run Code
# ==========================================================

@router.post(
    "/run",
    response_model=RunCodeResponse,
)
async def run_code(

    request: RunCodeRequest,

):

    try:

        return await compiler_service.run_code(

            request,

        )

    except Exception as exc:

        raise HTTPException(

            status_code=status.HTTP_400_BAD_REQUEST,

            detail=str(exc),

        )


# ==========================================================
# Submit Solution
# ==========================================================

@router.post(
    "/submit",
    response_model=SubmitCodeResponse,
)
async def submit_solution(

    request: SubmitCodeRequest,

    db: AsyncSession = Depends(get_db),

    current_user: User = Depends(
        get_current_user,
    ),

):

    try:

        return await compiler_service.submit_solution(

            db,

            current_user,

            request,

        )

    except ValueError as exc:

        raise HTTPException(

            status_code=status.HTTP_404_NOT_FOUND,

            detail=str(exc),

        )

    except Exception as exc:

        raise HTTPException(

            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,

            detail=str(exc),

        )


# ==========================================================
# My Submissions
# ==========================================================

@router.get(
    "/submissions/me",
)
async def my_submissions(

    db: AsyncSession = Depends(get_db),

    current_user: User = Depends(
        get_current_user,
    ),

):

    return await compiler_service.get_user_submissions(

        db,

        current_user,

    )


# ==========================================================
# Problem Submissions
# ==========================================================

@router.get(
    "/problem/{problem_id}/submissions",
)
async def problem_submissions(

    problem_id: int,

    db: AsyncSession = Depends(get_db),

):

    return await compiler_service.get_problem_submissions(

        db,

        problem_id,

    )