"""
=========================================================
SkillBattle Career Platform

Skill Gap Engine

Analyzes the difference between the candidate's
current profile and a target job.

=========================================================
"""

from __future__ import annotations

from app.modules.career.models.career_profile import CareerProfile
from app.modules.career.models.job import Job
from app.modules.career.models.resume import Resume


class SkillGapEngine:

    HIGH_PRIORITY = {

        "python",
        "java",
        "c++",
        "javascript",
        "typescript",
        "sql",
        "fastapi",
        "react",
        "docker",
        "kubernetes",
        "redis",
        "aws",
        "azure",
        "gcp",
        "machine learning",
        "deep learning",
    }

    # --------------------------------------------------

    def analyze(

        self,

        resume: Resume,

        profile: CareerProfile,

        job: Job,

    ) -> dict:

        current = {

            skill.lower()

            for skill in resume.skills

        }

        required = {

            skill.lower()

            for skill in job.required_skills

        }

        missing = sorted(

            required - current

        )

        matched = sorted(

            required & current

        )

        priority = self.priority_skills(

            missing,

        )

        return {

            "current_skills":

                sorted(current),

            "matched_skills":

                matched,

            "missing_skills":

                missing,

            "priority_skills":

                priority,

            "recommended_projects":

                self.projects(priority),

            "recommended_certifications":

                self.certifications(priority),

            "estimated_duration":

                self.duration(priority),

            "readiness_improvement":

                self.improvement(priority),

        }

    # --------------------------------------------------

    def priority_skills(

        self,

        missing_skills: list[str],

    ) -> list[str]:

        high = []

        normal = []

        for skill in missing_skills:

            if skill.lower() in self.HIGH_PRIORITY:

                high.append(skill)

            else:

                normal.append(skill)

        return high + normal

    # --------------------------------------------------

    def projects(

        self,

        skills: list[str],

    ) -> list[str]:

        projects = []

        mapping = {

            "fastapi":

                "Build a REST API using FastAPI.",

            "docker":

                "Containerize an existing project.",

            "redis":

                "Implement caching using Redis.",

            "react":

                "Develop a React dashboard.",

            "kubernetes":

                "Deploy an application on Kubernetes.",

            "machine learning":

                "Create an ML prediction project.",

            "deep learning":

                "Build an image classification model.",

            "aws":

                "Deploy an application on AWS.",

        }

        for skill in skills:

            project = mapping.get(

                skill.lower(),

            )

            if project:

                projects.append(project)

        return projects

    # --------------------------------------------------

    def certifications(

        self,

        skills: list[str],

    ) -> list[str]:

        recommendations = []

        mapping = {

            "aws":

                "AWS Certified Cloud Practitioner",

            "azure":

                "Microsoft Azure Fundamentals",

            "docker":

                "Docker Certified Associate",

            "kubernetes":

                "Certified Kubernetes Application Developer",

            "python":

                "PCAP Python Certification",

            "machine learning":

                "Google ML Crash Course",

        }

        for skill in skills:

            certificate = mapping.get(

                skill.lower(),

            )

            if certificate:

                recommendations.append(

                    certificate,

                )

        return recommendations

    # --------------------------------------------------

    def duration(

        self,

        skills: list[str],

    ) -> int:

        """
        Estimated learning time (weeks).
        """

        return max(

            2,

            len(skills) * 2,

        )

    # --------------------------------------------------

    def improvement(

        self,

        skills: list[str],

    ) -> float:

        """
        Estimated readiness improvement.
        """

        if not skills:

            return 100.0

        return round(

            min(

                len(skills) * 6,

                35,

            ),

            2,

        )


skill_gap_engine = SkillGapEngine()