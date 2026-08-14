"""
=========================================================

SkillBattle

Tournament Scheduler

Production Version

=========================================================
"""

from __future__ import annotations

from app.models.tournament_match import (
    TournamentMatch,
)

from app.modules.tournament.repository import (
    tournament_repository,
)

from app.modules.tournament.bracket import (
    tournament_bracket,
)


class TournamentScheduler:

    # =====================================================
    # Create First Round
    # =====================================================

    async def create_first_round(
        self,
        db,
        tournament,
        participants,
    ):

        bracket = tournament_bracket.single_elimination(
            participants,
        )

        first_round = bracket[0]

        created_matches = []

        for match in first_round["matches"]:

            player_one = match["player_one"]

            player_two = match["player_two"]

            db_match = TournamentMatch(

                tournament_id=tournament.id,

                round_number=1,

                player_one_id=(
                    player_one.user_id
                    if player_one
                    else None
                ),

                player_two_id=(
                    player_two.user_id
                    if player_two
                    else None
                ),

                winner_id=(
                    player_one.user_id
                    if match["bye"]
                    else None
                ),

                battle_id=None,

            )

            await tournament_repository.create_match(

                db,

                db_match,

            )

            created_matches.append(
                db_match,
            )

        await tournament_repository.commit(
            db,
        )

        return created_matches

    # =====================================================
    # Current Round
    # =====================================================

    async def current_round(
        self,
        db,
        tournament_id: str,
    ):

        matches = await tournament_repository.get_matches(
            db,
            tournament_id,
        )

        if not matches:
            return 1

        return max(
            match.round_number
            for match in matches
        )

    # =====================================================
    # Round Finished?
    # =====================================================

    async def round_finished(
        self,
        db,
        tournament_id: str,
        round_number: int,
    ):

        matches = await tournament_repository.get_matches(
            db,
            tournament_id,
        )

        matches = [

            match

            for match in matches

            if match.round_number == round_number

        ]

        return all(

            match.winner_id is not None

            for match in matches

        )

    # =====================================================
    # Winners
    # =====================================================

    async def winners(
        self,
        db,
        tournament_id: str,
        round_number: int,
    ):

        matches = await tournament_repository.get_matches(
            db,
            tournament_id,
        )

        return [

            match.winner_id

            for match in matches

            if (

                match.round_number == round_number

                and

                match.winner_id

            )

        ]

    # =====================================================
    # Next Round
    # =====================================================

    async def create_next_round(
        self,
        db,
        tournament,
        winners: list[str],
        round_number: int,
    ):

        created = []

        for index in range(
            0,
            len(winners),
            2,
        ):

            player_one = winners[index]

            player_two = (

                winners[index + 1]

                if index + 1 < len(winners)

                else None

            )

            match = TournamentMatch(

                tournament_id=tournament.id,

                round_number=round_number,

                player_one_id=player_one,

                player_two_id=player_two,

                winner_id=player_one
                if player_two is None
                else None,

                battle_id=None,

            )

            await tournament_repository.create_match(
                db,
                match,
            )

            created.append(
                match,
            )

        await tournament_repository.commit(
            db,
        )

        return created


tournament_scheduler = TournamentScheduler()