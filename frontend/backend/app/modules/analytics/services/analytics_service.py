from app.modules.analytics.engines.performance_engine import (
    performance_engine,
)

from app.modules.analytics.engines.recommendation_engine import (
    recommendation_engine,
)

from app.modules.analytics.engines.achievements.achievement_engine import (
    achievement_engine,
)


class AnalyticsService:

    def dashboard(

        self,

        stats,

        topics,

    ):

        return {

            "performance":

            performance_engine.analyze(

                stats,

            ),

            "recommendations":

            recommendation_engine.recommend(

                topics,

            ),

            "achievements":

            achievement_engine.unlock(

                stats,

            ),

        }


analytics_service = AnalyticsService()