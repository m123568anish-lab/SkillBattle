from datetime import datetime


class Scheduler:

    def create_round(

        self,

        matches,

    ):

        return {

            "created_at": datetime.utcnow(),

            "matches": matches,

        }


scheduler = Scheduler()