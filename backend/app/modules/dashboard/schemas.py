"""
=========================================================
SkillBattle

Dashboard Schemas

Production Ready
=========================================================
"""

from pydantic import BaseModel
from typing import List, Optional


# =========================================================
# User
# =========================================================

class UserSummary(BaseModel):
    id: str
    username: str
    full_name: str
    email: str
    avatar_url: Optional[str] = None
    role: str = "user"
    is_superuser: bool = False


# =========================================================
# Dashboard Stats
# =========================================================

class DashboardStats(BaseModel):
    xp: int
    level: int
    streak: int
    rating: int

    battles_played: int
    battles_won: int


# =========================================================
# Weekly Activity
# =========================================================

class WeeklyActivity(BaseModel):
    day: str
    xp: int


# =========================================================
# Achievement
# =========================================================

class Achievement(BaseModel):
    id: str
    title: str
    description: str
    icon: str


# =========================================================
# AI Recommendation
# =========================================================

class AIRecommendation(BaseModel):
    title: str
    message: str
    progress: int
    action: str


# =========================================================
# Daily Challenge
# =========================================================

class DailyChallenge(BaseModel):
    id: str
    title: str
    difficulty: str
    description: str
    xp_reward: int


# =========================================================
# Dashboard Response
# =========================================================

class DashboardResponse(BaseModel):

    user: UserSummary

    stats: DashboardStats

    weekly_activity: List[WeeklyActivity]

    achievements: List[Achievement]

    ai_recommendation: AIRecommendation

    daily_challenge: DailyChallenge

    command_center: Optional[dict] = None


class CommandCenterAction(BaseModel):
    type: str
    title: str
    description: str
    time: str
    priority: str = "MEDIUM"


class CommandCenterGap(BaseModel):
    skill_id: str
    skill_name: str
    mastery: str = "UNKNOWN"
    confidence: str = "LOW"
    trend: str = "INSUFFICIENT_DATA"
    priority: str = "UNKNOWN"
    reason: str = ""


class CommandCenterResponse(BaseModel):
    student_state: dict
    next_best_action: dict
    daily_actions: List[CommandCenterAction]
    placement_readiness: dict
    skill_gaps: List[CommandCenterGap]
    roadmap: dict
    study_hours: dict
    summary: dict
    members: dict = {"strong_skills": [], "weak_skills": []}