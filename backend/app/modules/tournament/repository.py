from typing import Optional

from sqlalchemy.orm import Session

from app.models.tournament import (
    Tournament,
    TournamentParticipant,
    TournamentMatch,
)


class TournamentRepository:

    # ==========================================================
    # Tournament
    # ==========================================================

    def create_tournament(
        self,
        db: Session,
        tournament: Tournament,
    ):

        db.add(tournament)

        db.flush()

        return tournament

    def get_tournament(
        self,
        db: Session,
        tournament_id: str,
    ) -> Optional[Tournament]:

        return (
            db.query(Tournament)
            .filter(
                Tournament.id == tournament_id
            )
            .first()
        )

    def get_all_tournaments(
        self,
        db: Session,
    ):

        return (
            db.query(Tournament)
            .order_by(
                Tournament.created_at.desc()
            )
            .all()
        )

    def update_tournament(
        self,
        db: Session,
        tournament: Tournament,
    ):

        db.add(tournament)

        db.flush()

        return tournament

    # ==========================================================
    # Participants
    # ==========================================================

    def add_participant(
        self,
        db: Session,
        participant: TournamentParticipant,
    ):

        db.add(participant)

        db.flush()

        return participant

    def get_participant(
        self,
        db: Session,
        tournament_id: str,
        user_id: str,
    ):

        return (
            db.query(TournamentParticipant)
            .filter(
                TournamentParticipant.tournament_id == tournament_id,
                TournamentParticipant.user_id == user_id,
            )
            .first()
        )

    def get_participants(
        self,
        db: Session,
        tournament_id: str,
    ):

        return (
            db.query(TournamentParticipant)
            .filter(
                TournamentParticipant.tournament_id == tournament_id
            )
            .all()
        )

    def remove_participant(
        self,
        db: Session,
        participant: TournamentParticipant,
    ):

        db.delete(participant)

    # ==========================================================
    # Matches
    # ==========================================================

    def create_match(
        self,
        db: Session,
        match: TournamentMatch,
    ):

        db.add(match)

        db.flush()

        return match

    def get_match(
        self,
        db: Session,
        match_id: str,
    ):

        return (
            db.query(TournamentMatch)
            .filter(
                TournamentMatch.id == match_id
            )
            .first()
        )

    def get_matches(
        self,
        db: Session,
        tournament_id: str,
    ):

        return (
            db.query(TournamentMatch)
            .filter(
                TournamentMatch.tournament_id == tournament_id
            )
            .order_by(
                TournamentMatch.round_number.asc()
            )
            .all()
        )

    def update_match(
        self,
        db: Session,
        match: TournamentMatch,
    ):

        db.add(match)

        db.flush()

        return match

    # ==========================================================
    # Helpers
    # ==========================================================

    def commit(
        self,
        db: Session,
    ):

        db.commit()

    def rollback(
        self,
        db: Session,
    ):

        db.rollback()

    def refresh(
        self,
        db: Session,
        obj,
    ):

        db.refresh(obj)


tournament_repository = TournamentRepository()