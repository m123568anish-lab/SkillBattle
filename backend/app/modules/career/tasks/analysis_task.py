"""
=========================================================

SkillBattle

Resume Background Analysis

=========================================================
"""

from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.career.pipeline.pipeline_service import (
    pipeline_service,
)

logger = logging.getLogger(__name__)


class AnalysisTask:

    async def run(

        self,

        db: AsyncSession,

        resume,

    ):

        try:

            logger.info(

                "Starting resume analysis %s",

                resume.id,

            )

            await pipeline_service.process_resume(

                db,

                resume,

            )

            logger.info(

                "Analysis completed %s",

                resume.id,

            )

        except Exception:

            logger.exception(

                "Resume analysis failed"

            )


analysis_task = AnalysisTask()