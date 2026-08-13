from enum import Enum


class BattleEvent(str, Enum):

    CONNECT = "connect"

    DISCONNECT = "disconnect"

    JOIN_ROOM = "join_room"

    LEAVE_ROOM = "leave_room"

    START_BATTLE = "start_battle"

    SUBMIT_CODE = "submit_code"

    CODE_CHANGE = "code_change"

    TIMER_UPDATE = "timer_update"

    SCORE_UPDATE = "score_update"

    CHAT_MESSAGE = "chat_message"

    FINISH = "finish"

    HEARTBEAT = "heartbeat"
    COUNTDOWN = "countdown"

BATTLE_STARTED = "battle_started"

BATTLE_FINISHED = "battle_finished"

PLAYER_READY = "player_ready"

SYNC_STATE = "sync_state"

PING = "ping"

PONG = "pong"
CODE_SYNC = "code_sync"

CURSOR_MOVE = "cursor_move"

DOCUMENT_VERSION = "document_version"

SAVE = "save"

AUTO_SAVE = "auto_save"

SUBMISSION_RESULT = "submission_result"