class TournamentAPI:

    def __init__(

        self,

        client,

    ):

        self.client = client

    def list(self):

        return self.client.get(

            "/tournament",

        ).json()

    def get(

        self,

        tournament_id,

    ):

        return self.client.get(

            f"/tournament/{tournament_id}",

        ).json()

    def create(

        self,

        payload,

    ):

        return self.client.post(

            "/tournament",

            json=payload,

        ).json()