"""
=========================================================

SkillBattle

Portfolio Evaluator

Evaluates portfolio quality and projects.

=========================================================
"""

from __future__ import annotations


class PortfolioEvaluator:

    """
    Portfolio Evaluation Engine
    """

    async def evaluate(

        self,

        extracted_data: dict,

    ) -> dict:

        score = 0

        recommendations = []

        strengths = []

        # =================================================
        # Projects
        # =================================================

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

            project_count * 10,

            40,

        )

        if project_count >= 4:

            strengths.append(

                "Strong project portfolio."

            )

        else:

            recommendations.append(

                "Build more real-world projects."

            )

        # =================================================
        # Technologies
        # =================================================

        technologies = projects.get(

            "technologies",

            [],

        )

        tech_count = len(

            technologies,

        )

        score += min(

            tech_count,

            20,

        )

        if tech_count >= 10:

            strengths.append(

                "Good technology diversity."

            )

        else:

            recommendations.append(

                "Use a wider variety of technologies."

            )

        # =================================================
        # GitHub
        # =================================================

        github_links = projects.get(

            "github",

            [],

        )

        if github_links:

            score += 15

            strengths.append(

                "GitHub repositories available."

            )

        else:

            recommendations.append(

                "Upload projects to GitHub."

            )

        # =================================================
        # Live Projects
        # =================================================

        live_links = projects.get(

            "live_demo",

            [],

        )

        if live_links:

            score += 15

            strengths.append(

                "Live project demonstrations available."

            )

        else:

            recommendations.append(

                "Deploy your projects online."

            )

        # =================================================
        # Categories
        # =================================================

        categories = projects.get(

            "categories",

            [],

        )

        score += min(

            len(categories) * 5,

            10,

        )

        if "AI/ML" in categories:

            strengths.append(

                "AI/ML projects detected."

            )

        # =================================================
        # Final Score
        # =================================================

        score = round(

            min(score, 100),

            1,

        )

        return {

            "portfolio_score": score,

            "level": self.level(score),

            "strengths": strengths,

            "recommendations": sorted(

                list(

                    set(

                        recommendations

                    )

                )

            ),

        }

    # =====================================================

    def level(

        self,

        score: float,

    ) -> str:

        if score >= 90:

            return "Outstanding"

        if score >= 80:

            return "Excellent"

        if score >= 70:

            return "Very Good"

        if score >= 60:

            return "Good"

        if score >= 40:

            return "Average"

        return "Needs Improvement"


portfolio_evaluator = PortfolioEvaluator()