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

    SUBMISSION = "submission"

    SCORE_UPDATED = "score_updated"

    LEADER_CHANGED = "leader_changed"

    TIMER_UPDATED = "timer_updated"

    CHAT = "chat"

    SYSTEM = "system"