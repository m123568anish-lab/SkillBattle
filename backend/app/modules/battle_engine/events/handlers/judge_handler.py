from app.modules.battle_engine.events.event import (
    BattleEvent,
)


class JudgeHandler:

    async def handle(

        self,

        event: BattleEvent,

    ):

        print(
            f"[Judge] {event.name}"
        )


judge_handler = JudgeHandler()