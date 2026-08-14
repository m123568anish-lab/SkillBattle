"""
=========================================================

SkillBattle

Problem Router

Production Version

=========================================================
"""

from __future__ import annotations

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)

from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db

from app.core.dependencies import (
    get_current_admin,
)

from .schemas import (
    CreateProblemRequest,
    UpdateProblemRequest,
    ProblemResponse,
)

from .service import (
    problem_service,
)

router = APIRouter(
    prefix="/problems",
    tags=["Problems"],
)


# ==========================================================
# Health
# ==========================================================

@router.get("/health")
async def health():

    return {
        "status": "healthy",
        "module": "problem",
    }


# ==========================================================
# Create
# ==========================================================

@router.post(
    "",
    response_model=ProblemResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_problem(

    request: CreateProblemRequest,

    db: AsyncSession = Depends(get_db),

    _: object = Depends(get_current_admin),

):

    try:

        return await problem_service.create_problem(
            db,
            request,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


# ==========================================================
# List
# ==========================================================

@router.get(
    "",
    response_model=list[ProblemResponse],
)
async def list_problems(

    skip: int = Query(
        default=0,
        ge=0,
    ),

    limit: int = Query(
        default=20,
        ge=1,
        le=100,
    ),

    db: AsyncSession = Depends(get_db),

):

    return await problem_service.list_problems(

        db,

        skip,

        limit,

    )


# ==========================================================
# Search
# ==========================================================

@router.get(
    "/search",
    response_model=list[ProblemResponse],
)
async def search_problem(

    keyword: str,

    db: AsyncSession = Depends(get_db),

):

    return await problem_service.search(

        db,

        keyword,

    )


# ==========================================================
# Difficulty
# ==========================================================

@router.get(
    "/difficulty/{difficulty}",
    response_model=list[ProblemResponse],
)
async def difficulty(

    difficulty: str,

    db: AsyncSession = Depends(get_db),

):

    return await problem_service.by_difficulty(

        db,

        difficulty,

    )


# ==========================================================
# Category
# ==========================================================

@router.get(
    "/category/{category}",
    response_model=list[ProblemResponse],
)
async def category(

    category: str,

    db: AsyncSession = Depends(get_db),

):

    return await problem_service.by_category(

        db,

        category,

    )


# ==========================================================
# Get
# ==========================================================

@router.get(
    "/{problem_id}",
    response_model=ProblemResponse,
)
async def get_problem(

    problem_id: int,

    db: AsyncSession = Depends(get_db),

):

    problem = await problem_service.get_problem(

        db,

        problem_id,

    )

    if problem is None:

        raise HTTPException(

            status_code=404,

            detail="Problem not found.",

        )

    return problem


# ==========================================================
# Update
# ==========================================================

@router.put(
    "/{problem_id}",
    response_model=ProblemResponse,
)
async def update_problem(

    problem_id: int,

    request: UpdateProblemRequest,

    db: AsyncSession = Depends(get_db),

    _: object = Depends(get_current_admin),

):

    try:

        return await problem_service.update_problem(

            db,

            problem_id,

            request,

        )

    except ValueError as exc:

        raise HTTPException(

            status_code=404,

            detail=str(exc),

        )


# ==========================================================
# Delete
# ==========================================================

@router.delete(
    "/{problem_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_problem(

    problem_id: int,

    db: AsyncSession = Depends(get_db),

    _: object = Depends(get_current_admin),

):

    try:

        await problem_service.delete_problem(

            db,

            problem_id,

        )

    except ValueError as exc:

        raise HTTPException(

            status_code=404,

            detail=str(exc),

        )