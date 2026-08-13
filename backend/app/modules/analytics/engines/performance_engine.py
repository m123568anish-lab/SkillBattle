from app.modules.analytics.managers.statistics_manager import (
    statistics_manager,
)


class PerformanceEngine:

    def analyze(

        self,

        stats,

    ):

        return {

            "rating":

            stats.current_rating,

            "highest_rating":

            stats.highest_rating,

            "win_rate":

            statistics_manager.win_rate(stats),

            "current_streak":

            stats.current_streak,

            "longest_streak":

            stats.longest_streak,

        }


performance_engine = PerformanceEngine()