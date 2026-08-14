"""
=========================================================

SkillBattle

AI Job Matcher

Matches resumes to suitable job roles.

=========================================================
"""

from __future__ import annotations

import json

from app.modules.career.ai.llm_client import llm_client
from app.modules.career.ai.prompt_templates import prompts


class JobMatcher:

    """
    AI Job Matching Engine
    """

    ROLE_DATABASE = {

        "AI Engineer": {

            "skills": {
                "python",
                "tensorflow",
                "pytorch",
                "machine learning",
                "deep learning",
                "docker",
                "git",
            }

        },

        "Machine Learning Engineer": {

            "skills": {
                "python",
                "tensorflow",
                "scikit-learn",
                "numpy",
                "pandas",
                "docker",
            }

        },

        "Backend Developer": {

            "skills": {
                "python",
                "fastapi",
                "flask",
                "django",
                "mysql",
                "postgresql",
                "docker",
            }

        },

        "Frontend Developer": {

            "skills": {
                "html",
                "css",
                "javascript",
                "typescript",
                "react",
                "next.js",
            }

        },

        "Full Stack Developer": {

            "skills": {
                "react",
                "next.js",
                "fastapi",
                "node.js",
                "mysql",
                "docker",
            }

        },

        "Data Scientist": {

            "skills": {
                "python",
                "pandas",
                "numpy",
                "matplotlib",
                "scikit-learn",
                "sql",
            }

        },

    }

    # ----------------------------------------------------

    async def match(

        self,

        extracted_data: dict,

        resume_text: str,

    ) -> dict:

        candidate_skills = {

            skill.lower()

            for skill in extracted_data
            .get("skills", {})
            .get("skills", [])

        }

        results = []

        for role, info in self.ROLE_DATABASE.items():

            required = info["skills"]

            matched = candidate_skills & required

            missing = required - candidate_skills

            confidence = round(

                len(matched) / len(required) * 100,

                1,

            )

            results.append({

                "role": role,

                "confidence": confidence,

                "matched_skills": sorted(matched),

                "missing_skills": sorted(missing),

            })

        results.sort(

            key=lambda item: item["confidence"],

            reverse=True,

        )

        ai_roles = await self.ai_roles(

            resume_text,

        )

        return {

            "recommended_roles": results[:5],

            "ai_suggestions": ai_roles,

        }

    # ----------------------------------------------------

    async def ai_roles(

        self,

        resume_text: str,

    ):

        prompt = prompts.job_matching(

            resume_text,

        )

        response = await llm_client.generate(

            prompt,

        )

        try:

            response = response.strip()

            if response.startswith("```"):

                response = response.replace(
                    "```json",
                    "",
                ).replace(
                    "```",
                    "",
                )

            data = json.loads(response)

            return data

        except Exception:

            return {

                "roles": [],

                "confidence": [],

                "reason": [],

            }


job_matcher = JobMatcher()