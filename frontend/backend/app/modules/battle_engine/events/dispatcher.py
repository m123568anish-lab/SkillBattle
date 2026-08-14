from .event import BattleEvent
from .event_bus import event_bus


class EventDispatcher:

    async def dispatch(

        self,

        event_name: str,

        room_id: str,

        user_id: str | None = None,

        payload: dict | None = None,

    ):

        event = BattleEvent(

            name=event_name,

            room_id=room_id,

            user_id=user_id,

            payload=payload or {},

        )

        await event_bus.publish(event)


dispatcher = EventDispatcher()