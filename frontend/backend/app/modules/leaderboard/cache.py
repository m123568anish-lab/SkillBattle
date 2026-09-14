"""
=========================================================

SkillBattle

Leaderboard Cache

=========================================================
"""

from __future__ import annotations

import time


class LeaderboardCache:

    def __init__(self, ttl_seconds: int = 30):

        self._cache = {}
        self._ttl_seconds = ttl_seconds

    def get(self, key):

        entry = self._cache.get(key)
        if entry is None:
            return None
        created_at, value = entry
        if time.monotonic() - created_at >= self._ttl_seconds:
            self._cache.pop(key, None)
            return None
        return value

    def set(self, key, value):

        self._cache[key] = (time.monotonic(), value)

    def clear(self):

        self._cache.clear()


leaderboard_cache = LeaderboardCache()