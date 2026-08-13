from datetime import datetime

from app.modules.battle.matchmaking.queue import (
    QueuePlayer,
    battle_queue,
)


class MatchmakingEngine:

    """
    Initial matchmaking engine.

    Future versions will match by:

    • XP
    • Rating
    • Level
    • Preferred language
    • Dream company
    """

    def join_queue(

        self,

        user_id: str,

        rating: int = 1000,

        level: int = 1,

    ):

        battle_queue.add(

            QueuePlayer(

                user_id=user_id,

                rating=rating,

                level=level,

                joined_at=datetime.utcnow(),

            )

        )

        return {

            "queue_size": battle_queue.size(),

        }

    # =========================================

    def leave_queue(

        self,

        user_id: str,

    ):

        battle_queue.remove(user_id)

    # =========================================

    def queue_size(self):

        return battle_queue.size()

    # =========================================

    def find_match(self):

        players = battle_queue.all()

        if len(players) < 2:

            return None

        player1 = players.pop(0)

        player2 = players.pop(0)

        return {

            "player1": player1,

            "player2": player2,

        }


matchmaking_engine = MatchmakingEngine()