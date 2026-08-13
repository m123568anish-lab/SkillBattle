"""
=========================================================

Router Registration

=========================================================
"""

from __future__ import annotations

from fastapi import FastAPI

# Authentication
from app.modules.auth.router import router as auth_router

# User/Profile
from app.modules.profile.router import router as profile_router

# Dashboard
from app.modules.dashboard.router import router as dashboard_router

# Problems
from app.modules.problem.router import router as problem_router

# Compiler
from app.modules.compiler.router import router as compiler_router

# Battle
from app.modules.battle.router import router as battle_router

# Tournament
from app.modules.tournament.router import router as tournament_router

# Leaderboard
from app.modules.leaderboard.router import router as leaderboard_router

# XP
from app.modules.xp.router import router as xp_router

# Achievements
from app.modules.achievements.router import (
    router as achievement_router,
)

# AI
from app.modules.ai.router import router as ai_router

# Notifications
from app.modules.notification.router import (
    router as notification_router,
)

# Storage
from app.modules.storage.router import (
    router as storage_router,
)

# Email
from app.modules.email.router import router as email_router


def register_all_routers(
    app: FastAPI,
):

    app.include_router(auth_router)

    app.include_router(profile_router)

    app.include_router(dashboard_router)

    app.include_router(problem_router)

    app.include_router(compiler_router)

    app.include_router(battle_router)

    app.include_router(tournament_router)

    app.include_router(leaderboard_router)

    app.include_router(xp_router)

    app.include_router(achievement_router)

    app.include_router(ai_router)

    app.include_router(notification_router)

    app.include_router(storage_router)

    app.include_router(email_router)