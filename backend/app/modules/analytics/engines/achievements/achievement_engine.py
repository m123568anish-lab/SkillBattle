class AchievementEngine:

    def unlock(

        self,

        stats,

    ):

        achievements = []

        if stats.wins >= 10:

            achievements.append(

                "Battle Beginner"

            )

        if stats.wins >= 100:

            achievements.append(

                "Battle Master"

            )

        if stats.current_streak >= 20:

            achievements.append(

                "Unstoppable"

            )

        return achievements


achievement_engine = AchievementEngine()