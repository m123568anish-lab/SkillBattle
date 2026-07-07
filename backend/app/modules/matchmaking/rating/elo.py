from .base import RatingProvider


class EloProvider(RatingProvider):

    BASE_RANGE = 100

    MAX_RANGE = 600

    EXPANSION_RATE = 25

    def compatible(

        self,

        first,

        second,

        waiting_seconds,

    ):

        current_range = min(

            self.BASE_RANGE +

            waiting_seconds * self.EXPANSION_RATE,

            self.MAX_RANGE,

        )

        return abs(first - second) <= current_range


elo_provider = EloProvider()