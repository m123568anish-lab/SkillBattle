from app.modules.battle.repository import (
    battle_repository,
)

from app.modules.battle.websocket import (
    battle_ws,
    BattleEvent,
)


class BattleLeaderboardService:

    """
    Handles live leaderboard ranking.
    """

    async def update(

        self,

        db,

        battle_id: str,

    ):

        participants = await battle_repository.get_participants(

            db,

            battle_id,

        )

        participants.sort(

            key=lambda p: (

                -p.score,

                p.joined_at,

            )

        )

        leaderboard = []

        for rank, player in enumerate(

            participants,

            start=1,

        ):

            player.rank = rank

            await battle_repository.update_participant(

                db,

                player,

            )

            leaderboard.append(

                {

                    "user_id": player.user_id,

                    "score": player.score,

                    "rank": rank,

                }

            )

        battle_repository.commit(db)

        await battle_ws.broadcast(

            battle_id,

            BattleEvent.SCORE_UPDATED,

            leaderboard,

        )

        return leaderboard

    # ================================================

    def winner(

        self,

        db,

        battle_id: str,

    ):

        participants = battle_repository.get_participants(

            db,

            battle_id,

        )

        if not participants:

            return None

        participants.sort(

            key=lambda p: (

                -p.score,

                p.joined_at,

            )

        )

        return participants[0]
    
    def update_final(
    self,
    db,
    battle_id: str,
):

     participants = battle_repository.get_participants(
        db,
        battle_id,
    )

     participants.sort(
        key=lambda p: (
            -p.score,
            p.joined_at,
        )
    )

     return participants


battle_leaderboard_service = BattleLeaderboardService()