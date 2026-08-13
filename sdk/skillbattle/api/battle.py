class BattleAPI:

    def __init__(

        self,

        client,

    ):

        self.client = client

    def list(self):

        return self.client.get(

            "/battle",

        ).json()

    def get(

        self,

        battle_id,

    ):

        return self.client.get(

            f"/battle/{battle_id}",

        ).json()

    def create(

        self,

        payload,

    ):

        return self.client.post(

            "/battle",

            json=payload,

        ).json()