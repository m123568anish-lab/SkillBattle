class StatisticsManager:

    def win_rate(

        self,

        stats,

    ):

        total = stats.wins + stats.losses

        if total == 0:

            return 0

        return round(

            stats.wins / total * 100,

            2,

        )

    def accuracy(

        self,

        solved,

        attempted,

    ):

        if attempted == 0:

            return 0

        return round(

            solved / attempted * 100,

            2,

        )


statistics_manager = StatisticsManager()