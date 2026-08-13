from collections import defaultdict

from app.modules.matchmaking.models.queue_player import QueuePlayer


class QueueManager:

    def __init__(self):

        self.queues = defaultdict(list)

    def join(

        self,

        player: QueuePlayer,

    ):

        self.queues[player.mode].append(player)

    def leave(

        self,

        user_id: str,

    ):

        for queue in self.queues.values():

            queue[:] = [

                player

                for player in queue

                if player.user_id != user_id

            ]

    def get_queue(

        self,

        mode: str,

    ):

        return self.queues[mode]


queue_manager = QueueManager()