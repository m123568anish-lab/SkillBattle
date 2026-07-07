"""
=========================================================

SkillBattle

AI Resume Analyzer

Uses LLM to analyze resumes.

=========================================================
"""

from __future__ import annotations

import json
import logging

from app.modules.career.ai.llm_client import (
    llm_client,
)

from app.modules.career.ai.prompt_templates import (
    prompts,
)

logger = logging.getLogger(__name__)


class ResumeAnalyzer:

    # ==================================================
    # Analyze Resume
    # ==================================================

    async def analyze(

        self,

        resume_text: str,

    ) -> dict:

        prompt = prompts.resume_analysis(

            resume_text,

        )

        response = await llm_client.generate(

            prompt,

        )

        return self.parse_response(

            response,

        )

    # ==================================================
    # Parse JSON
    # ==================================================

    def parse_response(

        self,

        response: str,

    ) -> dict:

        try:

            data = json.loads(response)

            return {

                "summary": data.get(

                    "summary",

                    "",

                ),

                "strengths": data.get(

                    "strengths",

                    [],

                ),

                "weaknesses": data.get(

                    "weaknesses",

                    [],

                ),

                "missing_skills": data.get(

                    "missing_skills",

                    [],

                ),

                "improvement_suggestions": data.get(

                    "improvement_suggestions",

                    [],

                ),

                "resume_score": int(

                    data.get(

                        "resume_score",

                        0,

                    )

                ),

            }

        except Exception as exc:

            logger.exception(exc)

            return self.fallback_response()

    # ==================================================
    # Fallback
    # ==================================================

    def fallback_response(

        self,

    ) -> dict:

        return {

            "summary": "",

            "strengths": [],

            "weaknesses": [],

            "missing_skills": [],

            "improvement_suggestions": [

                "AI response could not be processed."

            ],

            "resume_score": 0,

        }


resume_analyzer = ResumeAnalyzer()