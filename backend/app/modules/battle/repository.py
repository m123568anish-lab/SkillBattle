from typing import Optional

from sqlalchemy.orm import Session

from app.models.battle import (
    BattleRoom,
    BattleParticipant,
    BattleSubmission,
    BattleResult,
)


class BattleRepository:

    # ==========================================================
    # Battle Room
    # ==========================================================

    def create_battle(
        self,
        db: Session,
        battle: BattleRoom,
    ):

        db.add(battle)

        db.flush()

        return battle

    def get_battle(
        self,
        db: Session,
        battle_id: str,
    ) -> Optional[BattleRoom]:

        return (

            db.query(BattleRoom)

            .filter(
                BattleRoom.id == battle_id
            )

            .first()

        )

    def get_waiting_battles(
        self,
        db: Session,
    ):

        return (

            db.query(BattleRoom)

            .filter(
                BattleRoom.status == "waiting"
            )

            .all()

        )

    def update_battle(
        self,
        db: Session,
        battle: BattleRoom,
    ):

        db.add(battle)

        db.flush()

        return battle

    # ==========================================================
    # Participants
    # ==========================================================

    def add_participant(
        self,
        db: Session,
        participant: BattleParticipant,
    ):

        db.add(participant)

        db.flush()

        return participant

    def get_participants(
        self,
        db: Session,
        battle_id: str,
    ):

        return (

            db.query(BattleParticipant)

            .filter(
                BattleParticipant.battle_id == battle_id
            )

            .all()

        )

    def get_participant(
        self,
        db: Session,
        battle_id: str,
        user_id: str,
    ):

        return (

            db.query(BattleParticipant)

            .filter(

                BattleParticipant.battle_id == battle_id,

                BattleParticipant.user_id == user_id,

            )

            .first()

        )

    def update_participant(
        self,
        db: Session,
        participant: BattleParticipant,
    ):

        db.add(participant)

        db.flush()

        return participant

    def remove_participant(
        self,
        db: Session,
        participant: BattleParticipant,
    ):

        db.delete(participant)

        db.flush()

    # ==========================================================
    # Submissions
    # ==========================================================

    def create_submission(
        self,
        db: Session,
        submission: BattleSubmission,
    ):

        db.add(submission)

        db.flush()

        return submission

    def get_submissions(
        self,
        db: Session,
        battle_id: str,
    ):

        return (

            db.query(BattleSubmission)

            .filter(
                BattleSubmission.battle_id == battle_id
            )

            .all()

        )

    # ==========================================================
    # Results
    # ==========================================================

    def create_result(
        self,
        db: Session,
        result: BattleResult,
    ):

        db.add(result)

        db.flush()

        return result

    def get_result(
        self,
        db: Session,
        battle_id: str,
    ):

        return (

            db.query(BattleResult)

            .filter(
                BattleResult.battle_id == battle_id
            )

            .first()

        )

    # ==========================================================
    # Database Helpers
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


battle_repository = BattleRepository()