"""
=========================================================

SkillBattle Career Platform

AI Career Mentor

Provides personalized career guidance.

LLM Ready

=========================================================
"""

from __future__ import annotations

from app.modules.career.models.career_profile import CareerProfile
from app.modules.career.models.job import Job


class CareerMentorEngine:

    """
    Central AI mentor.
    """

    # --------------------------------------------------

    def build_prompt(

        self,

        profile: CareerProfile,

        job: Job | None,

        question: str,

    ) -> str:

        company = "Not Selected"

        role = "General Guidance"

        if job:

            company = job.company
            role = job.title

        return f"""
You are an experienced Senior Engineering Manager,
Technical Interviewer,
and Career Mentor.

Candidate

Name:
{profile.full_name}

Target Company:
{company}

Target Role:
{role}

Current Coding Rating:
{profile.coding_rating}

Resume Score:
{profile.resume_score}

Portfolio Score:
{profile.portfolio_score}

Interview Score:
{profile.interview_score}

ATS Score:
{profile.ats_score}

Skills:
{", ".join(profile.skills)}

Strengths:
{", ".join(profile.strengths)}

Weaknesses:
{", ".join(profile.weaknesses)}

Missing Skills:
{", ".join(profile.missing_skills)}

Achievements:
{", ".join(profile.achievements)}

Recommendations:
{", ".join(profile.recommendations)}

Question

{question}

Instructions

Provide:

1. Honest assessment

2. Step-by-step advice

3. Skills to improve

4. Projects to build

5. Interview preparation

6. Placement strategy

Avoid generic advice.

Do not invent experience.
"""

    # --------------------------------------------------

    async def ask(

        self,

        profile: CareerProfile,

        question: str,

        job: Job | None = None,

    ) -> dict:

        prompt = self.build_prompt(

            profile,

            job,

            question,

        )

        # Future:
        #
        # response = await ai_provider.generate(prompt)

        response = f"""
Based on your current profile, your strongest
areas are your coding experience and projects.

To improve your chances:

• Strengthen missing technical skills.

• Increase your coding rating.

• Build one production-quality project.

• Practice mock interviews.

• Improve ATS score above 90.

You are progressing well toward your target role.
"""

        return {

            "answer": response.strip(),

            "prompt": prompt,

            "target_company":

            job.company if job else None,

            "target_role":

            job.title if job else None,

        }

    # --------------------------------------------------

    def next_goals(

        self,

        profile: CareerProfile,

    ) -> list[str]:

        goals = []

        if profile.resume_score < 85:

            goals.append(

                "Improve resume quality."

            )

        if profile.portfolio_score < 85:

            goals.append(

                "Add one production-level project."

            )

        if profile.interview_score < 80:

            goals.append(

                "Complete 5 AI mock interviews."

            )

        if profile.coding_rating < 1700:

            goals.append(

                "Reach a coding rating of 1700."

            )

        if len(profile.skills) < 12:

            goals.append(

                "Expand your technical stack."

            )

        if not goals:

            goals.append(

                "Maintain consistency and prepare for interviews."

            )

        return goals

    # --------------------------------------------------

    def readiness_level(

        self,

        profile: CareerProfile,

    ) -> str:

        score = profile.overall_score

        if score >= 90:

            return "Excellent"

        if score >= 80:

            return "Placement Ready"

        if score >= 70:

            return "Almost Ready"

        if score >= 60:

            return "Intermediate"

        return "Beginner"


career_mentor_engine = CareerMentorEngine()