"""
=========================================================

SkillBattle

Leaderboard Schemas

=========================================================
"""

from __future__ import annotations

from pydantic import BaseModel


class LeaderboardEntry(BaseModel):

    rank: int

    user_id: str

    username: str

    full_name: str

    avatar: str | None = None

    xp: int

    level: int

    streak: int

    solved: int

    rating: int


class LeaderboardResponse(BaseModel):

    leaderboard: list[LeaderboardEntry]


class UserRankResponse(BaseModel):

    rank: int

    total_users: int

    xp: int

    level: int