from sqlalchemy.orm import Session

from app.models.user import User

from app.models.tournament import (
    Tournament,
    TournamentParticipant,
)

from app.modules.tournament.repository import (
    tournament_repository,
)

from app.modules.tournament.schemas import (
    CreateTournamentRequest,
)
from app.modules.tournament.bracket import (
    tournament_bracket_generator,
)
from app.modules.tournament.scheduler import (
    tournament_scheduler,
)
class TournamentService:

    # ==========================================================
    # Create Tournament
    # ==========================================================

    def create_tournament(
        self,
        db: Session,
        current_user: User,
        request: CreateTournamentRequest,
    ):

        tournament = Tournament(

            title=request.title,

            description=request.description,

            difficulty=request.difficulty,

            max_players=request.max_players,

            status="registration",

        )

        tournament_repository.create_tournament(
            db,
            tournament,
        )

        creator = TournamentParticipant(

            tournament_id=tournament.id,

            user_id=current_user.id,

        )

        tournament_repository.add_participant(
            db,
            creator,
        )

        tournament_repository.commit(db)

        tournament_repository.refresh(
            db,
            tournament,
        )

        return tournament

    # ==========================================================
    # Join Tournament
    # ==========================================================

    def join_tournament(
        self,
        db: Session,
        tournament_id: str,
        current_user: User,
    ):

        tournament = tournament_repository.get_tournament(
            db,
            tournament_id,
        )

        if tournament is None:

            raise ValueError(
                "Tournament not found."
            )

        if tournament.status != "registration":

            raise ValueError(
                "Registration is closed."
            )

        participant = tournament_repository.get_participant(
            db,
            tournament_id,
            current_user.id,
        )

        if participant:

            return tournament

        players = tournament_repository.get_participants(
            db,
            tournament_id,
        )

        if len(players) >= tournament.max_players:

            raise ValueError(
                "Tournament is full."
            )

        participant = TournamentParticipant(

            tournament_id=tournament.id,

            user_id=current_user.id,

        )

        tournament_repository.add_participant(
            db,
            participant,
        )

        tournament_repository.commit(db)

        return tournament

    # ==========================================================
    # Leave Tournament
    # ==========================================================

    def leave_tournament(
        self,
        db: Session,
        tournament_id: str,
        current_user: User,
    ):

        participant = tournament_repository.get_participant(
            db,
            tournament_id,
            current_user.id,
        )

        if participant is None:

            return

        tournament_repository.remove_participant(
            db,
            participant,
        )

        tournament_repository.commit(db)

    # ==========================================================
    # Tournament Details
    # ==========================================================

    def get_tournament(
        self,
        db: Session,
        tournament_id: str,
    ):

        return tournament_repository.get_tournament(
            db,
            tournament_id,
        )

    # ==========================================================
    # List Tournaments
    # ==========================================================

    def list_tournaments(
        self,
        db: Session,
    ):

        return tournament_repository.get_all_tournaments(
            db,
        )

    # ==========================================================
    # Participants
    # ==========================================================

    def participants(
        self,
        db: Session,
        tournament_id: str,
    ):

        return tournament_repository.get_participants(
            db,
            tournament_id,
        )

    # ==========================================================
    # Start Tournament
    # ==========================================================

    def start_tournament(
        self,
        db: Session,
        tournament_id: str,
    ):

        tournament = tournament_repository.get_tournament(
            db,
            tournament_id,
        )

        if tournament is None:

            raise ValueError(
                "Tournament not found."
            )

        participants = tournament_repository.get_participants(
            db,
            tournament_id,
        )

        if len(participants) < 2:

            raise ValueError(
                "At least two participants are required."
            )

        participants = tournament_repository.get_participants(
         db,
         tournament.id,
)

        tournament.status = "running"

        tournament_bracket_generator.generate(

         db,

        tournament.id,

        participants,

)

        tournament_repository.update_tournament(
         db,
         tournament,
)

        tournament_repository.commit(db)

        tournament_scheduler.start(
    db,
    tournament,
)

        return tournament


tournament_service = TournamentService()