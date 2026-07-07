"""
=========================================================

SkillBattle

AI Roadmap Generator

Generates personalized learning roadmap.

=========================================================
"""

from __future__ import annotations

import json

from app.modules.career.ai.llm_client import llm_client
from app.modules.career.ai.prompt_templates import prompts


class RoadmapGenerator:

    """
    AI Learning Roadmap Generator
    """

    # =====================================================

    async def generate(

        self,

        resume_text: str,

        extracted_data: dict,

        job_match: dict,

        placement: dict,

    ) -> dict:

        prompt = prompts.roadmap(

            resume_text,

        )

        response = await llm_client.generate(

            prompt,

        )

        ai_data = self.parse(

            response,

        )

        return {

            "placement_level": placement.get(

                "level",

                "Unknown",

            ),

            "placement_score": placement.get(

                "placement_score",

                0,

            ),

            "recommended_roles": [

                role["role"]

                for role in job_match.get(

                    "recommended_roles",

                    []

                )

            ],

            "missing_skills": self.collect_missing_skills(

                job_match,

            ),

            "roadmap": ai_data.get(

                "roadmap",

                [],

            ),

        }

    # =====================================================

    def collect_missing_skills(

        self,

        job_match: dict,

    ) -> list[str]:

        skills = []

        for role in job_match.get(

            "recommended_roles",

            [],

        ):

            skills.extend(

                role.get(

                    "missing_skills",

                    [],

                )

            )

        return sorted(

            list(

                set(skills)

            )

        )

    # =====================================================

    def parse(

        self,

        response: str,

    ) -> dict:

        try:

            response = response.strip()

            if response.startswith("```"):

                response = response.replace(

                    "```json",

                    "",

                )

                response = response.replace(

                    "```",

                    "",

                )

            return json.loads(

                response,

            )

        except Exception:

            return {

                "roadmap": [

                    {

                        "title": "Unable to generate roadmap",

                        "duration": "N/A",

                        "resources": [],

                    }

                ]

            }


roadmap_generator = RoadmapGenerator()