"""
=========================================================

SkillBattle

Placement Readiness Engine

Calculates overall placement readiness.

=========================================================
"""

from __future__ import annotations


class PlacementScore:

    """
    Placement Readiness Calculator
    """

    async def calculate(

        self,

        extracted_data: dict,

        resume_analysis: dict,

        ats_result: dict,

    ) -> dict:

        score = 0

        recommendations = []

        # =================================================
        # Resume Score (30)
        # =================================================

        resume_score = resume_analysis.get(

            "resume_score",

            0,

        )

        score += min(

            resume_score * 0.30,

            30,

        )

        # =================================================
        # ATS Score (20)
        # =================================================

        ats_score = ats_result.get(

            "ats_score",

            0,

        )

        score += min(

            ats_score * 0.20,

            20,

        )

        # =================================================
        # Skills (20)
        # =================================================

        total_skills = extracted_data.get(

            "skills",

            {},

        ).get(

            "total",

            0,

        )

        score += min(

            total_skills,

            20,

        )

        if total_skills < 12:

            recommendations.append(

                "Learn more industry-relevant skills."

            )

        # =================================================
        # Projects (10)
        # =================================================

        project_count = len(

            extracted_data.get(

                "projects",

                {},

            ).get(

                "projects",

                [],

            )

        )

        score += min(

            project_count * 2,

            10,

        )

        if project_count < 3:

            recommendations.append(

                "Build more portfolio projects."

            )

        # =================================================
        # Experience (10)
        # =================================================

        companies = len(

            extracted_data.get(

                "experience",

                {},

            ).get(

                "companies",

                [],

            )

        )

        score += min(

            companies * 5,

            10,

        )

        if companies == 0:

            recommendations.append(

                "Gain internship experience."

            )

        # =================================================
        # Certifications (5)
        # =================================================

        certifications = len(

            extracted_data.get(

                "certifications",

                {},

            ).get(

                "certifications",

                [],

            )

        )

        score += min(

            certifications,

            5,

        )

        # =================================================
        # Professional Profiles (5)
        # =================================================

        contact = extracted_data.get(

            "contact",

            {},

        )

        if contact.get("github"):

            score += 2.5

        else:

            recommendations.append(

                "Add your GitHub profile."

            )

        if contact.get("linkedin"):

            score += 2.5

        else:

            recommendations.append(

                "Create a LinkedIn profile."

            )

        # =================================================
        # Final Score
        # =================================================

        score = round(

            min(score, 100),

            1,

        )

        return {

            "placement_score": score,

            "level": self.get_level(score),

            "recommendations": sorted(

                list(

                    set(recommendations)

                )

            ),

        }

    # =====================================================

    def get_level(

        self,

        score: float,

    ) -> str:

        if score >= 90:

            return "Excellent"

        if score >= 80:

            return "Very Good"

        if score >= 70:

            return "Good"

        if score >= 60:

            return "Average"

        if score >= 40:

            return "Needs Improvement"

        return "Beginner"


placement_score = PlacementScore()