from app.modules.tournament.managers.scheduler import (
    scheduler,
)

from app.modules.tournament.managers.tournament_manager import (
    tournament_manager,
)

from .bracket_service import (
    bracket_service,
)


class TournamentService:

    def create(

        self,

        request,

    ):

        return tournament_manager.create(

            request.name,

            request.tournament_type,

            request.max_players,

        )

    def start(

        self,

        tournament,

        participants,

    ):

        matches = (

            bracket_service.generate(

                tournament,

                participants,

            )

        )

        tournament.started = True

        return scheduler.create_round(

            matches

        )


tournament_service = TournamentService()