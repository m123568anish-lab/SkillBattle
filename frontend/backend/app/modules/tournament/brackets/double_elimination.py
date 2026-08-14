from .base import BracketGenerator


class DoubleEliminationGenerator(

    BracketGenerator

):

    def generate(

        self,

        participants,

    ):
        # Minimal single-elimination bracket generator (used as a simple
        # placeholder for double-elimination). Produces rounds where winners
        # would advance; consumers can interpret structure for double-elim.
        players = list(participants)
        if not players:
            return []

        rounds = []
        current = players[:]
        while len(current) > 1:
            pairs = []
            it = iter(current)
            for a in it:
                try:
                    b = next(it)
                except StopIteration:
                    b = None
                pairs.append((a, b))
            rounds.append(pairs)
            # winners placeholder: keep first of each pair
            current = [a for (a, b) in pairs if a is not None]

        return rounds