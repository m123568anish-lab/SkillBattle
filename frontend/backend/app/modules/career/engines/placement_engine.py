"""
=========================================================

SkillBattle Career Platform

Placement Readiness Engine

Aggregates every career signal into one
Placement Readiness Score.

=========================================================
"""

from __future__ import annotations

from app.modules.career.models.career_profile import CareerProfile


class PlacementEngine:

    WEIGHTS = {

        "resume": 0.15,

        "portfolio": 0.20,

        "ats": 0.15,

        "coding": 0.20,

        "interview": 0.15,

        "skills": 0.10,

        "projects": 0.05,

    }

    # ---------------------------------------------------

    def evaluate(

        self,

        profile: CareerProfile,

    ) -> dict:

        coding_score = self.coding_score(

            profile,

        )

        skills_score = self.skills_score(

            profile,

        )

        project_score = self.project_score(

            profile,

        )

        overall = round(

            profile.resume_score

            * self.WEIGHTS["resume"]

            +

            profile.portfolio_score

            * self.WEIGHTS["portfolio"]

            +

            profile.ats_score

            * self.WEIGHTS["ats"]

            +

            coding_score

            * self.WEIGHTS["coding"]

            +

            profile.interview_score

            * self.WEIGHTS["interview"]

            +

            skills_score

            * self.WEIGHTS["skills"]

            +

            project_score

            * self.WEIGHTS["projects"],

            2,

        )

        return {

            "placement_score":

                overall,

            "coding_score":

                coding_score,

            "skills_score":

                skills_score,

            "project_score":

                project_score,

            "level":

                self.level(overall),

            "company_tier":

                self.company_tier(overall),

            "improvements":

                self.improvements(profile),

        }

    # ---------------------------------------------------

    def coding_score(

        self,

        profile: CareerProfile,

    ) -> float:

        rating = profile.coding_rating

        if rating >= 2200:

            return 100

        if rating >= 2000:

            return 95

        if rating >= 1800:

            return 90

        if rating >= 1600:

            return 80

        if rating >= 1400:

            return 70

        if rating >= 1200:

            return 60

        return 40

    # ---------------------------------------------------

    def skills_score(

        self,

        profile: CareerProfile,

    ) -> float:

        skills = len(profile.skills)

        if skills >= 20:

            return 100

        if skills >= 15:

            return 90

        if skills >= 12:

            return 80

        if skills >= 8:

            return 70

        return 50

    # ---------------------------------------------------

    def project_score(

        self,

        profile: CareerProfile,

    ) -> float:

        if profile.portfolio_score > 0:

            return profile.portfolio_score

        return 60

    # ---------------------------------------------------

    def level(

        self,

        score: float,

    ) -> str:

        if score >= 90:

            return "Excellent"

        if score >= 80:

            return "Placement Ready"

        if score >= 70:

            return "Good"

        if score >= 60:

            return "Needs Improvement"

        return "Beginner"

    # ---------------------------------------------------

    def company_tier(

        self,

        score: float,

    ) -> str:

        if score >= 90:

            return "FAANG / Top Product Companies"

        if score >= 80:

            return "Product Companies"

        if score >= 70:

            return "Large Service Companies"

        if score >= 60:

            return "Mid-size Companies"

        return "Internship / Entry Level"

    # ---------------------------------------------------

    def improvements(

        self,

        profile: CareerProfile,

    ) -> list[str]:

        suggestions = []

        if profile.resume_score < 85:

            suggestions.append(

                "Increase resume score above 85."

            )

        if profile.ats_score < 90:

            suggestions.append(

                "Improve ATS score by adding relevant keywords."

            )

        if profile.portfolio_score < 85:

            suggestions.append(

                "Build one more production-grade project."

            )

        if profile.interview_score < 80:

            suggestions.append(

                "Complete AI mock interviews."

            )

        if profile.coding_rating < 1700:

            suggestions.append(

                "Reach a coding rating of 1700+."

            )

        if len(profile.skills) < 15:

            suggestions.append(

                "Expand your technical skill set."

            )

        if profile.missing_skills:

            suggestions.append(

                "Focus on high-priority missing skills first."

            )

        if not suggestions:

            suggestions.append(

                "Maintain consistency and keep practicing."

            )

        return suggestions


placement_engine = PlacementEngine()