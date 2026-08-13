from enum import StrEnum


class BattleEvent(StrEnum):
    PLAYER_JOINED = "player_joined"
    PLAYER_LEFT = "player_left"

    BATTLE_STARTED = "battle_started"
    BATTLE_FINISHED = "battle_finished"

    SUBMISSION = "submission"
    SCORE_UPDATE = "score_update"

    TIMER = "timer"

    CHAT = "chat"

    SYSTEM = "system"