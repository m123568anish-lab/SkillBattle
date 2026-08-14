class SeedingManager:

    def seed_players(

        self,

        participants,

    ):

        participants.sort(

            key=lambda player: player.rating,

            reverse=True,

        )

        for index, player in enumerate(

            participants,

            start=1,

        ):

            player.seed = index

        return participants


seeding_manager = SeedingManager()