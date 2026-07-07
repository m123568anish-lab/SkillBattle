"""
=========================================================

SkillBattle

Career Router

=========================================================
"""
from fastapi import APIRouter

from app.modules.career.api.analysis import router as analysis_router
from app.modules.career.api.upload import router as upload_router

router = APIRouter(prefix="/career", tags=["Career"])

router.include_router(upload_router)
router.include_router(analysis_router)


@router.get("/health")
async def health() -> dict[str, str]:
    return {"module": "career", "status": "healthy"}