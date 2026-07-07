"""
=========================================================
SkillBattle Career Platform

Cover Letter Engine

Generates personalized cover letters.

Supports:

- Ollama
- OpenAI
- Gemini
- Claude

=========================================================
"""

from __future__ import annotations

from app.modules.career.models.career_profile import CareerProfile
from app.modules.career.models.job import Job

# Future shared AI provider
# from app.ai.provider import ai_provider


class CoverLetterEngine:

    def build_prompt(

        self,

        profile: CareerProfile,

        job: Job,

        tone: str = "professional",

    ) -> str:

        return f"""
You are an expert career coach.

Generate a {tone} cover letter.

Candidate

Name:
{profile.full_name}

Target Role:
{job.title}

Company:
{job.company}

Skills:
{", ".join(profile.skills)}

Strengths:
{", ".join(profile.strengths)}

Achievements:
{", ".join(profile.achievements)}

Projects:
Mention relevant AI and software projects.

Requirements

• Keep it under 350 words.

• Mention why the candidate is interested.

• Mention relevant technologies.

• Mention measurable impact.

• Professional ending.

Do not invent fake experience.
"""

    # ---------------------------------------------------

    async def generate(

        self,

        profile: CareerProfile,

        job: Job,

        tone: str = "professional",

    ) -> dict:

        prompt = self.build_prompt(

            profile,

            job,

            tone,

        )

        # Future
        #
        # response = await ai_provider.generate(
        #     prompt=prompt
        # )

        # Placeholder

        response = f"""
Dear Hiring Manager,

I am excited to apply for the
{job.title} position at
{job.company}.

My background in software
development together with my
experience in AI projects,
competitive programming,
and modern backend technologies
align well with your requirements.

I enjoy solving complex problems,
building scalable systems,
and continuously learning.

Thank you for your time.

Sincerely,

{profile.full_name}
"""

        return {

            "company": job.company,

            "role": job.title,

            "tone": tone,

            "cover_letter": response.strip(),

            "prompt": prompt,

        }

    # ---------------------------------------------------

    async def email_version(

        self,

        profile: CareerProfile,

        job: Job,

    ) -> dict:

        prompt = f"""
Write a professional job
application email.

Candidate:
{profile.full_name}

Company:
{job.company}

Role:
{job.title}

Maximum 120 words.
"""

        # response = await ai_provider.generate(prompt)

        response = f"""
Subject: Application for {job.title}

Dear Hiring Team,

I would like to apply for the
{job.title} role at
{job.company}.

My background in software
development and AI aligns
well with your requirements.

Please find my resume attached.

Thank you.

Regards,

{profile.full_name}
"""

        return {

            "subject":

            f"Application for {job.title}",

            "email":

            response.strip(),

            "prompt":

            prompt,

        }


cover_letter_engine = CoverLetterEngine()