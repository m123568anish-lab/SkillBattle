from .queue_policy import QueuePolicy


class RankedPolicy(QueuePolicy):

    def max_players(self):

        return 2

    def ranked(self):

        return True