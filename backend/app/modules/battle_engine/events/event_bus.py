from collections import defaultdict
from collections.abc import Awaitable, Callable

from .event import BattleEvent


EventHandler = Callable[
    [BattleEvent],
    Awaitable[None],
]


class EventBus:

    def __init__(self):

        self._handlers = defaultdict(list)

    def subscribe(

        self,

        event_name: str,

        handler: EventHandler,

    ):

        self._handlers[event_name].append(
            handler
        )

    async def publish(

        self,

        event: BattleEvent,

    ):

        handlers = self._handlers.get(
            event.name,
            [],
        )

        for handler in handlers:

            await handler(event)


event_bus = EventBus()