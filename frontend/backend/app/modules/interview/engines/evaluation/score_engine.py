class ScoreEngine:

    def score(

        self,

        correctness: float,

        communication: float,

        confidence: float,

    ):

        return round(

            correctness * 0.6 +

            communication * 0.2 +

            confidence * 0.2,

            2,

        )


score_engine = ScoreEngine()