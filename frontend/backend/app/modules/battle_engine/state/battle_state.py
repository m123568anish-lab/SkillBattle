from enum import Enum


class BattleState(str, Enum):

    WAITING = "waiting"

    COUNTDOWN = "countdown"

    LIVE = "live"

    PAUSED = "paused"

    FINISHED = "finished"

    CANCELLED = "cancelled"