import uuid

from app.modules.tournament.models.tournament import Tournament


class TournamentManager:

    def __init__(self):

        self.tournaments = {}

    def create(

        self,

        name,

        tournament_type,

        max_players,

    ):

        tournament = Tournament(

            id=str(uuid.uuid4()),

            name=name,

            tournament_type=tournament_type,

            max_players=max_players,

        )

        self.tournaments[

            tournament.id

        ] = tournament

        return tournament

    def get(

        self,

        tournament_id,

    ):

        return self.tournaments.get(

            tournament_id

        )

    def all(self):

        return list(

            self.tournaments.values()

        )


tournament_manager = TournamentManager()