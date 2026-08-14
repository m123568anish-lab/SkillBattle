"""
=========================================================
SkillBattle Career Platform

Roadmap Engine

Generates personalized learning roadmaps.

=========================================================
"""

from __future__ import annotations

from app.modules.career.models.career_profile import CareerProfile
from app.modules.career.models.job import Job


class RoadmapEngine:

    def generate(

        self,

        profile: CareerProfile,

        job: Job,

        gap_report: dict,

    ) -> dict:

        phases = [

            self.foundation_phase(

                gap_report,

            ),

            self.intermediate_phase(

                gap_report,

            ),

            self.advanced_phase(

                profile,

                job,

            ),

            self.interview_phase(

                profile,

                job,

            ),

        ]

        return {

            "title":

                f"{job.title} Roadmap",

            "company":

                job.company,

            "estimated_weeks":

                gap_report["estimated_duration"],

            "phases":

                phases,

            "final_goal":

                f"Become ready for "

                f"{job.company}",

        }

    # --------------------------------------------------

    def foundation_phase(

        self,

        gap: dict,

    ):

        return {

            "title":

                "Foundation",

            "duration":

                "2 Weeks",

            "skills":

                gap["priority_skills"][:3],

            "tasks": [

                "Complete beginner tutorials.",

                "Read official documentation.",

                "Build small practice programs.",

            ],

        }

    # --------------------------------------------------

    def intermediate_phase(

        self,

        gap: dict,

    ):

        return {

            "title":

                "Intermediate",

            "duration":

                "3 Weeks",

            "projects":

                gap["recommended_projects"],

            "certifications":

                gap["recommended_certifications"],

            "tasks": [

                "Solve medium coding problems.",

                "Deploy one production project.",

            ],

        }

    # --------------------------------------------------

    def advanced_phase(

        self,

        profile: CareerProfile,

        job: Job,

    ):

        return {

            "title":

                "Advanced",

            "duration":

                "3 Weeks",

            "tasks": [

                "System Design",

                "Performance Optimization",

                "Mock Coding Battles",

                "Open Source Contribution",

            ],

            "battle_target":

                50,

            "rating_goal":

                max(

                    profile.coding_rating,

                    1700,

                ),

        }

    # --------------------------------------------------

    def interview_phase(

        self,

        profile: CareerProfile,

        job: Job,

    ):

        return {

            "title":

                "Interview Ready",

            "duration":

                "2 Weeks",

            "tasks": [

                "AI Mock Interviews",

                "Resume Review",

                "Behavioral Questions",

                "Company Research",

            ],

            "companies": [

                job.company,

            ],

        }


roadmap_engine = RoadmapEngine()