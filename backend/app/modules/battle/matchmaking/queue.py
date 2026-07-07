from dataclasses import dataclass
from datetime import datetime


@dataclass
class QueuePlayer:

    user_id: str

    rating: int

    level: int

    joined_at: datetime


class MatchmakingQueue:

    def __init__(self):

        self.players = []

    # =========================================

    def add(self, player: QueuePlayer):

        if not any(
            p.user_id == player.user_id
            for p in self.players
        ):
            self.players.append(player)

    # =========================================

    def remove(self, user_id: str):

        self.players = [

            p

            for p in self.players

            if p.user_id != user_id

        ]

    # =========================================

    def all(self):

        return self.players

    # =========================================

    def size(self):

        return len(self.players)


battle_queue = MatchmakingQueue()