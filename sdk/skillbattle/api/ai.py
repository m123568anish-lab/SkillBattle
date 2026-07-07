class AIAPI:

    def __init__(

        self,

        client,

    ):

        self.client = client

    def code_review(

        self,

        payload,

    ):

        return self.client.post(

            "/code-review/review",

            json=payload,

        ).json()

    def battle_coach(

        self,

        payload,

    ):

        return self.client.post(

            "/battle-coach/analyze",

            json=payload,

        ).json()

    def learning_plan(

        self,

        payload,

    ):

        return self.client.post(

            "/learning-engine/generate",

            json=payload,

        ).json()