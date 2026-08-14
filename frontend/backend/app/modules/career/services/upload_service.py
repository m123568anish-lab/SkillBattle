"""
=========================================================

SkillBattle

Resume Upload Service

Business logic for uploading resumes.

=========================================================
"""

from __future__ import annotations

from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.resume import Resume
from app.models.user import User

from app.modules.career.storage.file_storage import file_storage
from app.modules.career.repositories.resume_repository import (
    resume_repository,
)
from app.modules.career.pipeline.pipeline_service import (
    pipeline_service,
)
from app.modules.career.schemas.upload import (
    ResumeMetadata,
    UploadResponse,
)


class UploadService:

    # =====================================================
    # Upload Resume
    # =====================================================

    async def upload_resume(

        self,

        db: AsyncSession,

        user: User,

        file: UploadFile,

    ):

        # --------------------------------------------
        # Save File
        # --------------------------------------------

        storage = await file_storage.save(file)

        # --------------------------------------------
        # Create Resume Record
        # --------------------------------------------

        resume = Resume(

            user_id=user.id,

            title=Path(storage["original_filename"]).stem,

            original_filename=storage["original_filename"],

            stored_filename=storage["stored_filename"],

            file_path=storage["file_path"],

            file_size=storage["file_size"],

            mime_type=storage["content_type"],

            raw_text="",

            metadata_json={

                "checksum": storage["checksum"]

            },

            parsed=False,

            ai_processed=False,

            ats_score=0,

            placement_score=0,

        )

        resume = await resume_repository.create(

            db,

            resume,

        )

        # --------------------------------------------
        # Run AI Pipeline
        # --------------------------------------------

        analysis = await pipeline_service.process_resume(

            db,

            resume,

        )

        # --------------------------------------------
        # Upload Metadata
        # --------------------------------------------

        metadata = ResumeMetadata(

            filename=resume.original_filename,

            content_type=resume.mime_type,

            file_size=resume.file_size,

            uploaded_at=resume.created_at,

        )

        upload = UploadResponse(

            success=True,

            message="Resume uploaded successfully.",

            resume_id=str(resume.id),

            metadata=metadata,

        )

        return {

            "upload": upload,

            "analysis": analysis,

        }

    # =====================================================
    # Delete Resume
    # =====================================================

    async def delete_resume(

        self,

        db: AsyncSession,

        resume: Resume,

    ) -> bool:

        file_storage.delete(

            resume.file_path,

        )

        return await resume_repository.delete(

            db,

            resume.id,

        )

    # =====================================================
    # User Resumes
    # =====================================================

    async def list_user_resumes(

        self,

        db: AsyncSession,

        user: User,

    ):

        return await resume_repository.get_user_resumes(

            db,

            user.id,

        )

    # =====================================================
    # Resume Details
    # =====================================================

    async def get_resume(

        self,

        db: AsyncSession,

        resume_id: str,

    ):

        return await resume_repository.get_by_id(

            db,

            resume_id,

        )


upload_service = UploadService()