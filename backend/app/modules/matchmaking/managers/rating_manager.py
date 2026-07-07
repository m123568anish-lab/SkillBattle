from datetime import datetime

from app.modules.matchmaking.rating.elo import (
    elo_provider,
)


class RatingManager:

    def compatible(

        self,

        first,

        second,

    ):

        waiting = min(

            (

                datetime.utcnow()

                - first.waiting_since

            ).seconds,

            (

                datetime.utcnow()

                - second.waiting_since

            ).seconds,

        )

        return elo_provider.compatible(

            first.rating,

            second.rating,

            waiting,

        )


rating_manager = RatingManager()