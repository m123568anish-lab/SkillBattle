from app.modules.battle_engine.events.event import (
    BattleEvent,
)


class SyncHandler:

    async def handle(

        self,

        event: BattleEvent,

    ):

        print(
            f"[Sync] {event.name}"
        )


sync_handler = SyncHandler()