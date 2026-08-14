"""
=========================================================

SkillBattle

Leaderboard Cache

=========================================================
"""

from __future__ import annotations


class LeaderboardCache:

    def __init__(self):

        self._cache = {}

    def get(self, key):

        return self._cache.get(key)

    def set(self, key, value):

        self._cache[key] = value

    def clear(self):

        self._cache.clear()


leaderboard_cache = LeaderboardCache()