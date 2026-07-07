from app.modules.tournament.brackets.single_elimination import (
    SingleEliminationGenerator,
)

from app.modules.tournament.managers.seeding_manager import (
    seeding_manager,
)


class BracketService:

    def generate(

        self,

        tournament,

        participants,

    ):

        participants = (

            seeding_manager.seed_players(

                participants

            )

        )

        if (

            tournament.tournament_type

            == "single"

        ):

            generator = (

                SingleEliminationGenerator()

            )

            return generator.generate(

                participants

            )

        raise ValueError(

            "Unsupported tournament type."

        )


bracket_service = BracketService()