"""
=========================================================

SkillBattle

Analysis API

=========================================================
"""

from __future__ import annotations

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user

from app.models.user import User
from app.database.session import get_db

from app.modules.career.repositories.resume_repository import (
    resume_repository,
)

from app.modules.career.schemas.analysis import (
    AnalysisStatusResponse,
)

router = APIRouter(

    prefix="/career",

    tags=["Career Analysis"],

)


# =====================================================

@router.get(

    "/analysis/{resume_id}",

    response_model=AnalysisStatusResponse,

)

async def analysis_status(

    resume_id: str,

    current_user: User = Depends(

        get_current_user,

    ),

    db: AsyncSession = Depends(

        get_db,

    ),

):

    resume = await resume_repository.get_by_id(

        db,

        resume_id,

    )

    if resume is None:

        raise HTTPException(

            status_code=404,

            detail="Resume not found.",

        )

    if resume.user_id != current_user.id:

        raise HTTPException(

            status_code=403,

            detail="Permission denied.",

        )

    if resume.ai_processed:

        status = "completed"

        progress = 100

    elif resume.parsed:

        status = "processing"

        progress = 60

    else:

        status = "pending"

        progress = 10

    return AnalysisStatusResponse(

        resume_id=str(resume.id),

        status=status,

        progress=progress,

        parsed=resume.parsed,

        ai_processed=resume.ai_processed,

        ats_score=resume.ats_score,

        placement_score=resume.placement_score,

        updated_at=resume.updated_at,

    )