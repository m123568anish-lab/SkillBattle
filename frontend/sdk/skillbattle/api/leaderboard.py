class LeaderboardAPI:

    def __init__(

        self,

        client,

    ):

        self.client = client

    def global_rankings(self):

        return self.client.get(

            "/leaderboard",

        ).json()