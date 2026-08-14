"""
=========================================================

Interview Router

=========================================================
"""

from __future__ import annotations

from fastapi import (
    APIRouter,
    Depends,
)

from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db

from app.models.user import User

from app.core.dependencies import (
    get_current_user,
)

from app.modules.interview.schemas import (
    InterviewCreate,
)

from app.modules.interview.service import (
    interview_service,
)

router = APIRouter(

    prefix="/interview",

    tags=["Interview"],

)


@router.get("/health")
async def health():

    return {

        "module": "interview",

        "status": "healthy",

    }


@router.post("/create")
async def create(

    payload: InterviewCreate,

    db: AsyncSession = Depends(get_db),

    current_user: User = Depends(
        get_current_user,
    ),

):

    return await interview_service.create_interview(

        db,

        current_user,

        payload,

    )


@router.post("/{interview_id}/start")
async def start(

    interview_id: str,

    db: AsyncSession = Depends(get_db),

):

    interview = await interview_service.start(

        db,

        interview_id,

    )

    question = await interview_service.first_question(
        interview,
    )

    return {

        "interview": interview,

        "question": question,

    }