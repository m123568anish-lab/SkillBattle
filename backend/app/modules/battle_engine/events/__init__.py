from .dispatcher import dispatcher
from .event_bus import event_bus

from .handlers.judge_handler import judge_handler
from .handlers.sync_handler import sync_handler
from .handlers.timer_handler import timer_handler
from .handlers.scoreboard_handler import (
    scoreboard_handler,
)

event_bus.subscribe(

    "submit_code",

    judge_handler.handle,

)

event_bus.subscribe(

    "code_sync",

    sync_handler.handle,

)

event_bus.subscribe(

    "timer",

    timer_handler.handle,

)

event_bus.subscribe(

    "score_update",

    scoreboard_handler.handle,
)