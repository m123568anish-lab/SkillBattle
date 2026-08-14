class LeaderboardService:

    def global_board(

        self,

        players,

    ):

        players.sort(

            key=lambda player: player.rating,

            reverse=True,

        )

        return players


leaderboard_service = LeaderboardService()