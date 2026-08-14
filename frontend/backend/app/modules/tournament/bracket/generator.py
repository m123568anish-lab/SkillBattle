import random

from app.models.tournament import (
    TournamentMatch,
)

from app.modules.tournament.repository import (
    tournament_repository,
)


class TournamentBracketGenerator:

    """
    Generates tournament brackets.
    """

    def generate(
        self,
        db,
        tournament_id: str,
        participants,
    ):

        players = participants.copy()

        random.shuffle(players)

        matches = []

        round_number = 1

        for i in range(0, len(players), 2):

            if i + 1 >= len(players):

                break

            match = TournamentMatch(

                tournament_id=tournament_id,

                round_number=round_number,

                player_one_id=players[i].user_id,

                player_two_id=players[i + 1].user_id,

            )

            tournament_repository.create_match(

                db,

                match,

            )

            matches.append(match)

        tournament_repository.commit(db)

        return matches


tournament_bracket_generator = TournamentBracketGenerator()