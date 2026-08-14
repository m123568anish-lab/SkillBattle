"""
=========================================================

SkillBattle

Pipeline Service

Executes the complete resume analysis pipeline
and saves results into the database.

=========================================================
"""

from __future__ import annotations

import json

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.resume import Resume

from app.modules.career.pipeline.analysis_pipeline import (
    analysis_pipeline,
)

from app.modules.career.repositories.resume_repository import (
    resume_repository,
)


class PipelineService:

    """
    Service responsible for executing
    the complete AI pipeline.
    """

    # =====================================================

    async def process_resume(

        self,

        db: AsyncSession,

        resume: Resume,

    ):

        # -----------------------------------------
        # Run Complete Analysis
        # -----------------------------------------

        result = await analysis_pipeline.analyze(

            resume,

        )

        # -----------------------------------------
        # Save Resume Text
        # -----------------------------------------

        resume.raw_text = result.resume_analysis.get(

            "summary",

            "",

        )

        # -----------------------------------------
        # Save Extracted Information
        # -----------------------------------------

        resume.metadata_json = {

            "contact": result.contact,

            "skills": result.skills,

            "education": result.education,

            "experience": result.experience,

            "projects": result.projects,

            "certifications": result.certifications,

        }

        # -----------------------------------------
        # Save AI Analysis
        # -----------------------------------------

        resume.ai_summary = result.resume_analysis.get(

            "summary",

            "",

        )

        resume.ai_strengths = result.resume_analysis.get(

            "strengths",

            [],

        )

        resume.ai_weaknesses = result.resume_analysis.get(

            "weaknesses",

            [],

        )

        resume.ai_recommendations = result.resume_analysis.get(

            "improvement_suggestions",

            [],

        )

        # -----------------------------------------
        # Scores
        # -----------------------------------------

        resume.ats_score = result.ats.get(

            "ats_score",

            0,

        )

        resume.placement_score = result.placement.get(

            "placement_score",

            0,

        )

        # -----------------------------------------
        # Flags
        # -----------------------------------------

        resume.parsed = True

        resume.ai_processed = True

        # -----------------------------------------
        # Save Complete Analysis JSON
        # -----------------------------------------

        resume.analysis_json = json.loads(

            result.model_dump_json()

        )

        # -----------------------------------------
        # Commit
        # -----------------------------------------

        await resume_repository.update(

            db,

            resume,

        )

        return result

    # =====================================================

    async def reanalyze(

        self,

        db: AsyncSession,

        resume: Resume,

    ):

        resume.parsed = False

        resume.ai_processed = False

        return await self.process_resume(

            db,

            resume,

        )


pipeline_service = PipelineService()