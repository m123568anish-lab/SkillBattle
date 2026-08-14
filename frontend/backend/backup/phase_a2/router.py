from fastapi import APIRouter

from app.api.v1 import mentor_router

from app.modules.auth.router import router as auth_router
from app.modules.profile.router import router as profile_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.battle.router import router as battle_router
from app.modules.tournament.router import router as tournament_router
from app.modules.interview.router import router as interview_router
from app.modules.problem_generator.router import router as problem_router
from app.modules.code_review.router import router as code_review_router
from app.modules.learning_engine.router import router as learning_router
from app.modules.battle_coach.router import router as coach_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(profile_router)
api_router.include_router(dashboard_router)
api_router.include_router(battle_router)
api_router.include_router(tournament_router)
api_router.include_router(interview_router)
api_router.include_router(problem_router)
api_router.include_router(code_review_router)
api_router.include_router(coach_router)
api_router.include_router(learning_router)
api_router.include_router(mentor_router)