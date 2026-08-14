"""
=========================================================

SkillBattle

AI Career Mentor

Provides personalized career guidance
based on resume and extracted data.

=========================================================
"""

from __future__ import annotations

from app.modules.career.ai.llm_client import llm_client
from app.modules.career.ai.prompt_templates import prompts


class CareerMentor:

    """
    AI Career Mentor
    """

    # =====================================================

    async def ask(

        self,

        question: str,

        resume_text: str,

        extracted_data: dict,

        placement: dict,

        job_match: dict,

    ) -> dict:

        context = self.build_context(

            extracted_data,

            placement,

            job_match,

        )

        full_prompt = f"""
Resume Context

{resume_text}

----------------------------------

Candidate Information

{context}

----------------------------------

{prompts.mentor(resume_text, question)}
"""

        answer = await llm_client.generate(

            full_prompt,

            temperature=0.5,

        )

        return {

            "question": question,

            "answer": answer,

        }

    # =====================================================

    def build_context(

        self,

        extracted_data: dict,

        placement: dict,

        job_match: dict,

    ) -> str:

        contact = extracted_data.get("contact", {})
        skills = extracted_data.get("skills", {})
        experience = extracted_data.get("experience", {})
        education = extracted_data.get("education", {})

        roles = [

            role["role"]

            for role in job_match.get(

                "recommended_roles",

                []

            )

        ]

        return f"""
Name: {contact.get("name", "Unknown")}

Skills:
{", ".join(skills.get("skills", []))}

Degrees:
{", ".join(education.get("degrees", []))}

Companies:
{", ".join(experience.get("companies", []))}

Placement Score:
{placement.get("placement_score", 0)}

Placement Level:
{placement.get("level", "Unknown")}

Recommended Roles:
{", ".join(roles)}
"""

mentor = CareerMentor()