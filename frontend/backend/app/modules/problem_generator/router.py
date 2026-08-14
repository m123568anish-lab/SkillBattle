"""
=========================================================

SkillBattle

AI Problem Generator Router

Production Version

=========================================================
"""

from __future__ import annotations

from fastapi import (
    APIRouter,
    HTTPException,
    status,
)

from .schemas import (
    GenerateProblemRequest,
    AIProblemResponse,
)

from .service import (
    problem_generator_service,
)

router = APIRouter(

    prefix="/problem-generator",

    tags=["AI Problem Generator"],

)


# ==========================================================
# Health
# ==========================================================

@router.get("/health")
async def health():

    return {

        "status": "healthy",

        "module": "problem-generator",

    }


# ==========================================================
# Generate
# ==========================================================

@router.post(

    "/generate",

    response_model=AIProblemResponse,

)

async def generate_problem(

    request: GenerateProblemRequest,

):

    try:

        return await problem_generator_service.generate(

            difficulty=request.difficulty,

            topic=request.topic,

            company=request.company,

            rating=request.rating,

        )

    except Exception as exc:

        raise HTTPException(

            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,

            detail=str(exc),

        )