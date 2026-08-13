from sqlalchemy.orm import Session

from app.modules.battle.repository import (
    battle_repository,
)


class BattleReplayService:

    """
    Generates battle replay data.
    """

    def replay(

        self,

        db: Session,

        battle_id: str,

    ):

        submissions = battle_repository.get_submissions(

            db,

            battle_id,

        )

        submissions.sort(

            key=lambda s: s.submitted_at

        )

        return {

            "battle_id": battle_id,

            "submissions": submissions,

        }


battle_replay_service = BattleReplayService()