"""
=========================================================

SkillBattle

ATS Resume Scoring Engine

Hybrid ATS scoring using
Rule Engine + AI Feedback

=========================================================
"""

from __future__ import annotations

from app.modules.career.ai.llm_client import llm_client
from app.modules.career.ai.prompt_templates import prompts


class ATSEngine:

    """
    Hybrid ATS Scoring Engine
    """

    # -------------------------------------------------

    async def analyze(

        self,

        extracted_data: dict,

        resume_text: str,

    ) -> dict:

        score = 0

        recommendations = []

        # ============================================
        # Contact Information
        # ============================================

        contact = extracted_data.get("contact", {})

        if contact.get("email"):

            score += 5

        else:

            recommendations.append(

                "Add an email address."

            )

        if contact.get("phone"):

            score += 5

        else:

            recommendations.append(

                "Add a phone number."

            )

        if contact.get("linkedin"):

            score += 5

        else:

            recommendations.append(

                "Add a LinkedIn profile."

            )

        if contact.get("github"):

            score += 5

        else:

            recommendations.append(

                "Add a GitHub profile."

            )

        # ============================================
        # Skills
        # ============================================

        skills = extracted_data.get(

            "skills",

            {},

        )

        total_skills = skills.get(

            "total",

            0,

        )

        score += min(

            total_skills,

            20,

        )

        if total_skills < 10:

            recommendations.append(

                "Include more technical skills."

            )

        # ============================================
        # Education
        # ============================================

        education = extracted_data.get(

            "education",

            {},

        )

        if education.get("degrees"):

            score += 10

        else:

            recommendations.append(

                "Education section missing."

            )

        # ============================================
        # Experience
        # ============================================

        experience = extracted_data.get(

            "experience",

            {},

        )

        companies = experience.get(

            "companies",

            [],

        )

        score += min(

            len(companies) * 5,

            15,

        )

        # ============================================
        # Projects
        # ============================================

        projects = extracted_data.get(

            "projects",

            {},

        )

        project_count = len(

            projects.get(

                "projects",

                [],

            )

        )

        score += min(

            project_count * 5,

            20,

        )

        if project_count < 2:

            recommendations.append(

                "Add more practical projects."

            )

        # ============================================
        # Certifications
        # ============================================

        certs = extracted_data.get(

            "certifications",

            {},

        )

        cert_count = len(

            certs.get(

                "certifications",

                [],

            )

        )

        score += min(

            cert_count * 2,

            10,

        )

        # ============================================
        # AI Suggestions
        # ============================================

        ai_feedback = await self.ai_feedback(

            resume_text,

        )

        recommendations.extend(

            ai_feedback

        )

        score = min(

            score,

            100,

        )

        return {

            "ats_score": score,

            "recommendations": sorted(

                list(

                    set(

                        recommendations

                    )

                )

            ),

        }

    # -------------------------------------------------

    async def ai_feedback(

        self,

        resume_text: str,

    ) -> list[str]:

        prompt = prompts.ats_analysis(

            resume_text,

        )

        response = await llm_client.generate(

            prompt,

        )

        try:

            import json

            data = json.loads(

                response,

            )

            return data.get(

                "recommendations",

                [],

            )

        except Exception:

            return []


ats_engine = ATSEngine()