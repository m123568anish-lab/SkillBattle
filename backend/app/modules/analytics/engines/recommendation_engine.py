from app.modules.analytics.engines.skills.skill_analyzer import (
    skill_analyzer,
)


class RecommendationEngine:

    def recommend(

        self,

        topics,

    ):

        analysis = skill_analyzer.analyze(

            topics,

        )

        recommendations = []

        for topic in analysis["weaknesses"]:

            recommendations.append(

                {

                    "topic": topic["name"],

                    "priority": "High",

                    "action": "Practice 10 more problems",

                }

            )

        return recommendations


recommendation_engine = RecommendationEngine()