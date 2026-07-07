from fastapi import APIRouter, FastAPI

from app.modules.auth.router import router as auth_router
from app.api.dashboard.router import router as dashboard_router
from app.api.v1.router import api_router
from app.modules.achievements.router import router as achievements_router
from app.modules.ai.router import router as ai_router
from app.modules.analytics.router import router as analytics_router
from app.modules.anti_cheat.router import router as anti_cheat_router
from app.modules.battle.router import router as battle_router
from app.modules.battle_coach.router import router as battle_coach_router
from app.modules.code_review.router import router as code_review_router
from app.modules.compiler.router import router as compiler_router
from app.modules.career.router import router as career_router
from app.modules.dashboard.router import router as dashboard_router_module
from app.modules.developer.router import router as developer_router
from app.modules.developer_portal.router import router as developer_portal_router
from app.modules.interview.router import router as interview_router
from app.modules.learning_engine.router import router as learning_engine_router
from app.modules.matchmaking.router import router as matchmaking_router
from app.modules.problem_generator.router import router as problem_generator_router
from app.modules.profile.router import router as profile_router
from app.modules.recruiter.router import router as recruiter_router
from app.modules.roadmap.router import router as roadmap_router
from app.modules.streak.router import router as streak_router
from app.modules.tournament.router import router as tournament_router
from app.modules.xp.router import router as xp_router


ROUTERS: list[tuple[str, APIRouter]] = [
    ("achievements", achievements_router),
    ("auth", auth_router),
    ("profile", profile_router),
    ("dashboard", dashboard_router_module),
    ("xp", xp_router),
    ("streak", streak_router),
    ("ai", ai_router),
    ("roadmap", roadmap_router),
    ("interview", interview_router),
    ("compiler", compiler_router),
    ("battle", battle_router),
    ("tournament", tournament_router),
    ("problem_generator", problem_generator_router),
    ("code_review", code_review_router),
    ("battle_coach", battle_coach_router),
    ("learning_engine", learning_engine_router),
    ("anti_cheat", anti_cheat_router),
    ("recruiter", recruiter_router),
    ("developer", developer_router),
    ("analytics", analytics_router),
    ("developer_portal", developer_portal_router),
    ("matchmaking", matchmaking_router),
    ("career", career_router),
    ("api_v1", api_router),
]


def register_routers(app: FastAPI) -> None:
    for _, router in ROUTERS:
        app.include_router(router)
