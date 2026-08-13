"""
=========================================================

SkillBattle

Career Analysis Pipeline

Orchestrates the complete AI analysis workflow.

=========================================================
"""

from __future__ import annotations

from app.modules.career.parsers.parser_manager import (
    parser_manager,
)

from app.modules.career.extractors.extractor_manager import (
    extractor_manager,
)

from app.modules.career.ai.resume_analyzer import (
    resume_analyzer,
)

from app.modules.career.ai.ats_engine import (
    ats_engine,
)

from app.modules.career.ai.job_matcher import (
    job_matcher,
)

from app.modules.career.ai.placement_score import (
    placement_score,
)

from app.modules.career.ai.roadmap_generator import (
    roadmap_generator,
)

from app.modules.career.ai.portfolio_evaluator import (
    portfolio_evaluator,
)

from app.modules.career.pipeline.pipeline_result import (
    PipelineResult,
    ResumeResult,
)


class AnalysisPipeline:

    """
    Complete Resume Analysis Pipeline
    """

    # =====================================================
    # Run Pipeline
    # =====================================================

    async def analyze(

        self,

        resume,

    ) -> PipelineResult:

        # ------------------------------------------
        # Parse Resume
        # ------------------------------------------

        parsed = parser_manager.parse(

            resume.file_path,

        )

        clean_text = parsed["clean_text"]

        # ------------------------------------------
        # Extract Information
        # ------------------------------------------

        extracted = extractor_manager.extract(

            clean_text,

        )

        # ------------------------------------------
        # Resume Analysis
        # ------------------------------------------

        resume_analysis = await resume_analyzer.analyze(

            clean_text,

        )

        # ------------------------------------------
        # ATS Analysis
        # ------------------------------------------

        ats = await ats_engine.analyze(

            extracted,

            clean_text,

        )

        # ------------------------------------------
        # Job Matching
        # ------------------------------------------

        jobs = await job_matcher.match(

            extracted,

            clean_text,

        )

        # ------------------------------------------
        # Placement Score
        # ------------------------------------------

        placement = await placement_score.calculate(

            extracted,

            resume_analysis,

            ats,

        )

        # ------------------------------------------
        # Learning Roadmap
        # ------------------------------------------

        roadmap = await roadmap_generator.generate(

            clean_text,

            extracted,

            jobs,

            placement,

        )

        # ------------------------------------------
        # Portfolio Evaluation
        # ------------------------------------------

        portfolio = await portfolio_evaluator.evaluate(

            extracted,

        )

        # ------------------------------------------
        # Return Result
        # ------------------------------------------

        return PipelineResult(

            success=True,

            message="Resume analyzed successfully.",

            resume=ResumeResult(

                id=str(resume.id),

                filename=resume.original_filename,

                uploaded_at=resume.created_at,

            ),

            contact=extracted["contact"],

            skills=extracted["skills"],

            education=extracted["education"],

            experience=extracted["experience"],

            projects=extracted["projects"],

            certifications=extracted["certifications"],

            resume_analysis=resume_analysis,

            ats=ats,

            job_match=jobs,

            placement=placement,

            roadmap=roadmap,

            portfolio=portfolio,

        )


analysis_pipeline = AnalysisPipeline()