"""
=========================================================

SkillBattle

Resume Repository

Handles all Resume database operations.

=========================================================
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy import delete

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.resume import Resume


class ResumeRepository:

    # =====================================================
    # Create Resume
    # =====================================================

    async def create(

        self,

        db: AsyncSession,

        resume: Resume,

    ) -> Resume:

        db.add(resume)

        await db.commit()

        await db.refresh(resume)

        return resume

    # =====================================================
    # Get Resume By ID
    # =====================================================

    async def get_by_id(

        self,

        db: AsyncSession,

        resume_id: str,

    ) -> Resume | None:

        result = await db.execute(

            select(Resume).where(

                Resume.id == resume_id

            )

        )

        return result.scalar_one_or_none()

    # =====================================================
    # Get User Resumes
    # =====================================================

    async def get_user_resumes(

        self,

        db: AsyncSession,

        user_id: str,

    ) -> list[Resume]:

        result = await db.execute(

            select(Resume)

            .where(

                Resume.user_id == user_id

            )

            .order_by(

                Resume.created_at.desc()

            )

        )

        return list(result.scalars().all())

    # =====================================================
    # Update Resume
    # =====================================================

    async def update(

        self,

        db: AsyncSession,

        resume: Resume,

    ) -> Resume:

        await db.commit()

        await db.refresh(resume)

        return resume

    # =====================================================
    # Delete Resume
    # =====================================================

    async def delete(

        self,

        db: AsyncSession,

        resume_id: str,

    ) -> bool:

        result = await db.execute(

            delete(Resume).where(

                Resume.id == resume_id

            )

        )

        await db.commit()

        return result.rowcount > 0

    # =====================================================
    # Parsing Status
    # =====================================================

    async def mark_parsed(

        self,

        db: AsyncSession,

        resume: Resume,

    ) -> Resume:

        resume.parsed = True

        await db.commit()

        await db.refresh(resume)

        return resume

    # =====================================================
    # AI Status
    # =====================================================

    async def mark_ai_processed(

        self,

        db: AsyncSession,

        resume: Resume,

    ) -> Resume:

        resume.ai_processed = True

        await db.commit()

        await db.refresh(resume)

        return resume

    # =====================================================
    # ATS Score
    # =====================================================

    async def update_ats_score(

        self,

        db: AsyncSession,

        resume: Resume,

        score: int,

    ) -> Resume:

        resume.ats_score = score

        await db.commit()

        await db.refresh(resume)

        return resume

    # =====================================================
    # Placement Score
    # =====================================================

    async def update_placement_score(

        self,

        db: AsyncSession,

        resume: Resume,

        score: int,

    ) -> Resume:

        resume.placement_score = score

        await db.commit()

        await db.refresh(resume)

        return resume

    # =====================================================
    # AI Summary
    # =====================================================

    async def update_ai_summary(

        self,

        db: AsyncSession,

        resume: Resume,

        summary: str,

        strengths: list,

        weaknesses: list,

        recommendations: list,

    ) -> Resume:

        resume.ai_summary = summary

        resume.ai_strengths = strengths

        resume.ai_weaknesses = weaknesses

        resume.ai_recommendations = recommendations

        resume.ai_processed = True

        await db.commit()

        await db.refresh(resume)

        return resume
    # =====================================================
    # Analysis
    # =====================================================
class ResumeRepository:
    ...
    # existing methods

    async def get_analysis(
        self,
        db: AsyncSession,
        resume_id: str,
    ):
        resume = await self.get_by_id(
            db,
            resume_id,
        )

        if resume is None:
            return None

        return resume.analysis_json


resume_repository = ResumeRepository()