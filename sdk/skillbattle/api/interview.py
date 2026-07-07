class InterviewAPI:

    def __init__(

        self,

        client,

    ):

        self.client = client

    def create(

        self,

        payload,

    ):

        return self.client.post(

            "/interview",

            json=payload,

        ).json()