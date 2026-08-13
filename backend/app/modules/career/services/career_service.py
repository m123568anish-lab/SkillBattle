"""
=========================================================

SkillBattle Career Platform

Career Service

Central orchestrator for all career engines.

=========================================================
"""

from __future__ import annotations

from app.modules.career.engines.ats_engine import (
    ats_engine,
)
from app.modules.career.engines.cover_letter_engine import (
    cover_letter_engine,
)
from app.modules.career.engines.job_matching_engine import (
    job_matching_engine,
)
from app.modules.career.engines.mentor_engine import (
    career_mentor_engine,
)
from app.modules.career.engines.placement_engine import (
    placement_engine,
)
from app.modules.career.engines.resume_engine import (
    resume_engine,
)
from app.modules.career.engines.roadmap_engine import (
    roadmap_engine,
)
from app.modules.career.engines.skill_gap_engine import (
    skill_gap_engine,
)
from app.modules.career.models.career_profile import (
    CareerProfile,
)
from app.modules.career.models.job import (
    Job,
)
from app.modules.career.models.resume import (
    Resume,
)


class CareerService:

    # --------------------------------------------------

    def parse_resume(

        self,

        file_path: str,

        user_id: str,

    ) -> Resume:

        return resume_engine.parse(

            file_path,

            user_id,

        )

    # --------------------------------------------------

    def analyze_resume(

        self,

        resume: Resume,

        job: Job | None = None,

    ) -> dict:

        return ats_engine.analyze(

            resume,

            job,

        )

    # --------------------------------------------------

    def match_job(

        self,

        resume: Resume,

        profile: CareerProfile,

        job: Job,

    ) -> dict:

        return job_matching_engine.analyze(

            resume,

            profile,

            job,

        )

    # --------------------------------------------------

    def skill_gap(

        self,

        resume: Resume,

        profile: CareerProfile,

        job: Job,

    ) -> dict:

        return skill_gap_engine.analyze(

            resume,

            profile,

            job,

        )

    # --------------------------------------------------

    def roadmap(

        self,

        profile: CareerProfile,

        job: Job,

        gap: dict,

    ) -> dict:

        return roadmap_engine.generate(

            profile,

            job,

            gap,

        )

    # --------------------------------------------------

    async def cover_letter(

        self,

        profile: CareerProfile,

        job: Job,

        tone: str = "professional",

    ) -> dict:

        return await cover_letter_engine.generate(

            profile,

            job,

            tone,

        )

    # --------------------------------------------------

    async def mentor(

        self,

        profile: CareerProfile,

        question: str,

        job: Job | None = None,

    ) -> dict:

        return await career_mentor_engine.ask(

            profile,

            question,

            job,

        )

    # --------------------------------------------------

    def placement(

        self,

        profile: CareerProfile,

    ) -> dict:

        return placement_engine.evaluate(

            profile,

        )

    # --------------------------------------------------

    def dashboard(

        self,

        resume: Resume,

        profile: CareerProfile,

        job: Job | None = None,

    ) -> dict:

        ats_report = self.analyze_resume(

            resume,

            job,

        )

        placement = self.placement(

            profile,

        )

        dashboard = {

            "profile": {

                "name": profile.full_name,

                "target_role": profile.target_role,

                "target_company": profile.target_company,

            },

            "scores": {

                "overall": profile.overall_score,

                "placement": placement["placement_score"],

                "resume": profile.resume_score,

                "portfolio": profile.portfolio_score,

                "interview": profile.interview_score,

                "ats": ats_report["overall_score"],

            },

            "career": {

                "level": placement["level"],

                "company_tier": placement["company_tier"],

            },

            "recommendations":

                placement["improvements"],

        }

        if job:

            dashboard["job_match"] = self.match_job(

                resume,

                profile,

                job,

            )

            gap = self.skill_gap(

                resume,

                profile,

                job,

            )

            dashboard["skill_gap"] = gap

            dashboard["roadmap"] = self.roadmap(

                profile,

                job,

                gap,

            )

        return dashboard


career_service = CareerService()