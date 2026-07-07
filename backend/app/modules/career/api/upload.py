"""
=========================================================

SkillBattle

Career Upload API

=========================================================
"""

from __future__ import annotations
from fastapi import BackgroundTasks
from fastapi import APIRouter
from fastapi import Depends
from fastapi import File
from fastapi import HTTPException
from fastapi import UploadFile
from fastapi import status

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user

from app.models.user import User
from app.database.session import get_db

from app.modules.career.schemas.upload import (
    UploadResponse,
    ResumeInfo,
    DeleteResumeResponse,
)

from app.modules.career.services.upload_service import (
    upload_service,
)

router = APIRouter(
    prefix="/career",
    tags=["Career"],
)


# ==========================================================
# Upload Resume
# ==========================================================

@router.post("/upload-resume")
async def upload_resume(

    background_tasks: BackgroundTasks,

    file: UploadFile = File(...),

    current_user: User = Depends(get_current_user),

    db: AsyncSession = Depends(get_db),

):

    result = await upload_service.upload_resume(

        db=db,

        user=current_user,

        file=file,

    )

    return result


# ==========================================================
# Get My Resumes
# ==========================================================

@router.get(
    "/resumes",
    response_model=list[ResumeInfo],
)
async def my_resumes(

    current_user: User = Depends(get_current_user),

    db: AsyncSession = Depends(get_db),

):

    return await upload_service.list_user_resumes(

        db,

        current_user,

    )


# ==========================================================
# Get Resume
# ==========================================================

@router.get(
    "/resume/{resume_id}",
)
async def get_resume(

    resume_id: str,

    current_user: User = Depends(get_current_user),

    db: AsyncSession = Depends(get_db),

):

    resume = await upload_service.get_resume(

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

    return resume


# ==========================================================
# Delete Resume
# ==========================================================

@router.delete(
    "/resume/{resume_id}",
    response_model=DeleteResumeResponse,
)
async def delete_resume(

    resume_id: str,

    current_user: User = Depends(get_current_user),

    db: AsyncSession = Depends(get_db),

):

    resume = await upload_service.get_resume(

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

    await upload_service.delete_resume(

        db,

        resume,

    )

    return {

        "success": True,

        "message": "Resume deleted successfully.",

    }


# ==========================================================
# Upload Status
# ==========================================================

@router.get("/health")
async def health():

    return {

        "module": "Career",

        "status": "healthy",

    }