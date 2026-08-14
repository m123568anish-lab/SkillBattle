from .score_engine import (
    score_engine,
)


class EvaluationEngine:

    def evaluate(

        self,

        answer,

    ):

        return {

            "score":

            score_engine.score(

                80,

                75,

                85,

            ),

            "feedback":

            "Good explanation. Improve edge case discussion.",

        }


evaluation_engine = EvaluationEngine()