from app.modules.battle_engine.events.event import (
    BattleEvent,
)


class TimerHandler:

    async def handle(

        self,

        event: BattleEvent,

    ):

        print(
            f"[Timer] {event.name}"
        )


timer_handler = TimerHandler()