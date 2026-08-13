"""
=========================================================

SkillBattle

Admin Schemas

=========================================================
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class DailyChallengeCreate(BaseModel):
    title: str = Field(..., max_length=200)
    difficulty: str = Field("Medium", max_length=50)
    category: str = Field("Algorithms", max_length=100)


class DailyChallengeResponse(BaseModel):
    id: int
    title: str
    difficulty: str
    category: str


class AdminUserUpdate(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None
    full_name: Optional[str] = None


class AdminUserResponse(BaseModel):
    id: str
    username: str
    full_name: str
    email: str
    role: str
    is_active: bool
    is_superuser: bool
    created_at: Optional[datetime] = None


class BattleLogItem(BaseModel):
    id: str
    room_code: Optional[str] = None
    mode: str
    status: str
    created_at: Optional[datetime] = None


class BattleSettings(BaseModel):
    battle_duration_minutes: int = 30
    xp_multiplier: float = 1.0
    allow_custom_battles: bool = True
