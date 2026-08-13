"""
=========================================================

SkillBattle Career Platform

AI Resume Engine

Pipeline

Resume
    │
    ▼
Resume Engine
    │
    ▼
ATS Engine
    │
    ▼
Prompt Builder
    │
    ▼
Career AI
    │
    ▼
AI Resume Report

=========================================================
"""

from __future__ import annotations

import json

from app.modules.career.engines.ats_engine import ats_engine
from app.modules.career.engines.resume_engine import resume_engine
from app.modules.career.llm.career_ai import career_ai
from app.modules.career.llm.prompts import career_prompts
from app.modules.career.models.job import Job


class ResumeAI:

    # ----------------------------------------------------

    async def review_resume(

        self,

        file_path: str,

        user_id: str,

    ) -> dict:

        resume = resume_engine.parse(

            file_path,

            user_id,

        )

        prompt = career_prompts.RESUME_REVIEW.substitute(

            resume=resume.raw_text,

        )

        response = await career_ai.generate(

            prompt,

        )

        return {

            "resume": resume,

            "ai_review": self.safe_json(

                response,

            ),

        }

    # ----------------------------------------------------

    async def ats_review(

        self,

        file_path: str,

        user_id: str,

        job: Job,

    ) -> dict:

        resume = resume_engine.parse(

            file_path,

            user_id,

        )

        ats = ats_engine.analyze(

            resume,

            job,

        )

        prompt = career_prompts.ATS_OPTIMIZER.substitute(

            resume=resume.raw_text,

            job=job.description,

        )

        ai = await career_ai.generate(

            prompt,

        )

        return {

            "resume": resume,

            "ats": ats,

            "ai": self.safe_json(

                ai,

            ),

        }

    # ----------------------------------------------------

    async def rewrite_resume(

        self,

        file_path: str,

        user_id: str,

    ) -> dict:

        resume = resume_engine.parse(

            file_path,

            user_id,

        )

        prompt = career_prompts.RESUME_REWRITE.substitute(

            resume=resume.raw_text,

        )

        rewritten = await career_ai.generate(

            prompt,

        )

        return {

            "original": resume.raw_text,

            "rewritten": rewritten,

        }

    # ----------------------------------------------------

    async def match_job(

        self,

        file_path: str,

        user_id: str,

        job: Job,

    ) -> dict:

        resume = resume_engine.parse(

            file_path,

            user_id,

        )

        prompt = career_prompts.JOB_MATCH.substitute(

            resume=resume.raw_text,

            job=job.description,

        )

        response = await career_ai.generate(

            prompt,

        )

        return self.safe_json(

            response,

        )

    # ----------------------------------------------------

    def safe_json(

        self,

        text: str,

    ) -> dict:

        try:

            return json.loads(

                text,

            )

        except Exception:

            return {

                "raw_response": text,

            }


resume_ai = ResumeAI()