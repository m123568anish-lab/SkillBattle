from sqlalchemy.orm import Session

from app.modules.battle.leaderboard import (
    battle_leaderboard_service,
)

from app.modules.xp.service import (
    xp_service,
)

from app.modules.achievements.service import (
    achievement_service,
)


class BattleRewardService:

    """
    Awards XP and updates player ratings after battles.
    """

    WIN_XP = 150

    PARTICIPATION_XP = 50

    WIN_RATING = 25

    LOSS_RATING = -10

    def finish_battle(
        self,
        db: Session,
        battle_id: str,
    ):

        participants = battle_leaderboard_service.update_final(
            db,
            battle_id,
        )

        if not participants:
            return

        winner = participants[0]

        for participant in participants:

            if participant.user_id == winner.user_id:

                xp_service.add_xp(
                    db,
                    participant.user,
                    self.WIN_XP,
                )

                if hasattr(participant.user, "rating"):
                    participant.user.rating += self.WIN_RATING

            else:

                xp_service.add_xp(
                    db,
                    participant.user,
                    self.PARTICIPATION_XP,
                )

                if hasattr(participant.user, "rating"):
                    participant.user.rating = max(
                        0,
                        participant.user.rating + self.LOSS_RATING,
                    )

            achievement_service.check_achievements(
                db,
                participant.user,
            )

        db.commit()

        return {

            "winner": winner.user_id,

            "players": len(participants),

        }


battle_reward_service = BattleRewardService()