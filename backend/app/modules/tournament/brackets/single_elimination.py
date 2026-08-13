from .base import BracketGenerator


class SingleEliminationGenerator(

    BracketGenerator

):

    def generate(

        self,

        participants,

    ):

        matches = []

        for i in range(

            0,

            len(participants),

            2,

        ):

            matches.append(

                (

                    participants[i],

                    participants[i + 1],

                )

            )

        return matches