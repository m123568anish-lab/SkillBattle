"""
=========================================================

SkillBattle

Battle Events

=========================================================
"""

from __future__ import annotations

from enum import Enum


class BattleEvent(str, Enum):

    PLAYER_JOINED = "player_joined"

    PLAYER_LEFT = "player_left"

    BATTLE_STARTED = "battle_started"

    BATTLE_FINISHED = "battle_finished"

    SECTION_TRANSITION = "section_transition"

    SUBMISSION = "submission"

    SUBMIT_ANSWER = "submit_answer"

    SCORE_UPDATED = "score_updated"

    LEADER_CHANGED = "leader_changed"

    TIMER_UPDATED = "timer_updated"

    STATE_SYNC = "state_sync"

    RECONNECT_SYNC = "reconnect_sync"

    ANTI_CHEAT_WARNING = "anti_cheat_warning"

    FORFEIT = "forfeit"

    CHAT = "chat"

    SYSTEM = "system"