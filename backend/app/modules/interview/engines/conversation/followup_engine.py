class FollowupEngine:

    def generate(

        self,

        question,

        answer,

    ):

        return (

            f"Can you explain why "

            f"{answer[:30]}...?"

        )


followup_engine = FollowupEngine()