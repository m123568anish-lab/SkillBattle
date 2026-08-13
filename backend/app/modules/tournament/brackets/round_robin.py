from .base import BracketGenerator


class RoundRobinGenerator(

    BracketGenerator

):

    def generate(

        self,

        participants,

    ):
        # Classic round-robin (circle) algorithm.
        players = list(participants)
        if not players:
            return []

        # If odd, add a bye
        bye = None
        if len(players) % 2 == 1:
            bye = "__BYE__"
            players.append(bye)

        n = len(players)
        rounds = []
        for i in range(n - 1):
            pairs = []
            for j in range(n // 2):
                a = players[j]
                b = players[n - 1 - j]
                if a == bye or b == bye:
                    pairs.append((a if b == bye else b, None))
                else:
                    pairs.append((a, b))
            rounds.append(pairs)
            # rotate
            players = [players[0]] + [players[-1]] + players[1:-1]

        return rounds