from sqlalchemy.orm import Session

from app.modules.tournament.repository import (
    tournament_repository,
)

from app.modules.tournament.bracket import (
    tournament_bracket_generator,
)

# Avoid top-level import of battle_service to prevent circular imports.
from app.models.tournament import (
    TournamentMatch,
)

from collections import defaultdict

class TournamentScheduler:

    """
    Controls tournament progression.
    """

    # ======================================================
    # Start Tournament
    # ======================================================

    def start(
        self,
        db: Session,
        tournament,
    ):

        participants = tournament_repository.get_participants(
            db,
            tournament.id,
        )

        matches = tournament_bracket_generator.generate(
            db,
            tournament.id,
            participants,
        )

        for match in matches:

            self.launch_match(
                db,
                tournament,
                match,
            )

        return matches

    # ======================================================
    # Launch Match
    # ======================================================

    def launch_match(
    self,
    db,
    tournament,
    match,
):

        # Import here to avoid circular import at module load time.
        from app.modules.battle.service import battle_service

        battle = battle_service.create_system_battle(

            db=db,

            title=f"Tournament Round {match.round_number}",

            difficulty=tournament.difficulty,

            problem_id=match.round_number,

            player_one_id=match.player_one_id,

            player_two_id=match.player_two_id,

        )

        match.battle_id = battle.id

        tournament_repository.update_match(
            db,
            match,
        )

        tournament_repository.commit(db)

        return battle

    # ======================================================
    # Advance Winner
    # ======================================================

    def advance(
        self,
        db: Session,
        tournament_id: str,
        winner_id: str,
    ):

        """
        Placeholder.

        Phase 8 will create
        next round automatically.
        """

        return {
            "winner": winner_id,
        }
    
    # ======================================================
    # Complete Match
    # ======================================================

def complete_match(

    self,

    db: Session,

    match_id: str,

    winner_id: str,

):

    match = tournament_repository.get_match(

        db,

        match_id,

    )

    if match is None:

        raise ValueError(

            "Tournament match not found."

        )

    match.winner_id = winner_id

    tournament_repository.update_match(

        db,

        match,

    )

    tournament_repository.commit(db)

    return self.advance_round(

        db,

        match.tournament_id,

        match.round_number,

    )

    # ======================================================
# Advance Round
# ======================================================

def advance_round(

    self,

    db: Session,

    tournament_id: str,

    current_round: int,

):

    matches = tournament_repository.get_matches(

        db,

        tournament_id,

    )

    current = [

        m

        for m in matches

        if m.round_number == current_round

    ]

    if any(

        m.winner_id is None

        for m in current

    ):

        return {

            "status": "waiting",

        }

    winners = [

        m.winner_id

        for m in current

    ]

    if len(winners) == 1:

        tournament = tournament_repository.get_tournament(

            db,

            tournament_id,

        )

        tournament.status = "completed"

        tournament_repository.update_tournament(

            db,

            tournament,

        )

        tournament_repository.commit(db)

        return {

            "status": "completed",

            "champion": winners[0],

        }

    next_round = current_round + 1

    created = []

    for i in range(0, len(winners), 2):

        if i + 1 >= len(winners):

            break

        match = TournamentMatch(

            tournament_id=tournament_id,

            round_number=next_round,

            player_one_id=winners[i],

            player_two_id=winners[i + 1],

        )

        tournament_repository.create_match(

            db,

            match,

        )

        created.append(match)

    tournament_repository.commit(db)

    tournament = tournament_repository.get_tournament(

        db,

        tournament_id,

    )

    for match in created:

        self.launch_match(

            db,

            tournament,

            match,

        )

    return {

        "status": "next_round",

        "round": next_round,

    }


tournament_scheduler = TournamentScheduler()