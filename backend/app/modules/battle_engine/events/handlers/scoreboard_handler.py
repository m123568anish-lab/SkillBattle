from app.modules.battle_engine.events.event import (
    BattleEvent,
)


class ScoreboardHandler:

    async def handle(

        self,

        event: BattleEvent,

    ):

        print(
            f"[Scoreboard] {event.name}"
        )


scoreboard_handler = ScoreboardHandler()