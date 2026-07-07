"""
=========================================================
SkillBattle Career Platform

Job Matching Engine

Compares Resume + Career Profile against a Job.

=========================================================
"""

from __future__ import annotations

from app.modules.career.models.career_profile import CareerProfile
from app.modules.career.models.job import Job
from app.modules.career.models.resume import Resume


class JobMatchingEngine:

    # -----------------------------------------------------

    def analyze(
        self,
        resume: Resume,
        profile: CareerProfile,
        job: Job,
    ) -> dict:

        matched = self.matched_skills(
            resume,
            job,
        )

        missing = self.missing_skills(
            resume,
            job,
        )

        skill_score = self.skill_score(
            resume,
            job,
        )

        experience_score = self.experience_score(
            profile,
            job,
        )

        project_score = self.project_score(
            resume,
            job,
        )

        ats_score = resume.ats_score

        company_score = round(

            skill_score * 0.40 +

            experience_score * 0.20 +

            project_score * 0.15 +

            ats_score * 0.25,

            2,

        )

        return {

            "company": job.company,

            "role": job.title,

            "overall_match": company_score,

            "skill_score": skill_score,

            "experience_score": experience_score,

            "project_score": project_score,

            "ats_score": ats_score,

            "matched_skills": matched,

            "missing_skills": missing,

            "recommendations": self.recommendations(

                missing,

                profile,

                job,

            ),

        }

    # -----------------------------------------------------

    def matched_skills(
        self,
        resume: Resume,
        job: Job,
    ) -> list[str]:

        resume_skills = {

            skill.lower()

            for skill in resume.skills

        }

        return [

            skill

            for skill in job.required_skills

            if skill.lower() in resume_skills

        ]

    # -----------------------------------------------------

    def missing_skills(
        self,
        resume: Resume,
        job: Job,
    ) -> list[str]:

        resume_skills = {

            skill.lower()

            for skill in resume.skills

        }

        return [

            skill

            for skill in job.required_skills

            if skill.lower() not in resume_skills

        ]

    # -----------------------------------------------------

    def skill_score(
        self,
        resume: Resume,
        job: Job,
    ) -> float:

        required = len(job.required_skills)

        if required == 0:

            return 100.0

        matched = len(

            self.matched_skills(

                resume,

                job,

            )

        )

        return round(

            matched / required * 100,

            2,

        )

    # -----------------------------------------------------

    def experience_score(
        self,
        profile: CareerProfile,
        job: Job,
    ) -> float:

        required = job.experience_required

        if required == 0:

            return 100.0

        ratio = (

            profile.years_of_experience

            / required

        )

        return round(

            min(

                ratio,

                1.0,

            ) * 100,

            2,

        )

    # -----------------------------------------------------

    def project_score(
        self,
        resume: Resume,
        job: Job,
    ) -> float:

        required = len(

            job.required_projects

        )

        if required == 0:

            return 100.0

        candidate = len(

            resume.projects

        )

        return round(

            min(

                candidate / required,

                1.0,

            ) * 100,

            2,

        )

    # -----------------------------------------------------

    def recommendations(
        self,
        missing_skills: list[str],
        profile: CareerProfile,
        job: Job,
    ) -> list[str]:

        recommendations = []

        if missing_skills:

            recommendations.append(

                "Learn: "

                + ", ".join(

                    missing_skills[:5]

                )

            )

        if profile.resume_score < 80:

            recommendations.append(

                "Improve resume quality."

            )

        if profile.portfolio_score < 80:

            recommendations.append(

                "Strengthen your portfolio."

            )

        if profile.interview_score < 75:

            recommendations.append(

                "Practice technical interviews."

            )

        if profile.coding_rating < 1500:

            recommendations.append(

                "Increase coding rating through battles."

            )

        if not recommendations:

            recommendations.append(

                "Excellent fit for this role."

            )

        return recommendations


job_matching_engine = JobMatchingEngine()