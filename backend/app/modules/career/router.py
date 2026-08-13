"""
=========================================================
SkillBattle - Career Router
=========================================================
"""
from fastapi import APIRouter

from app.modules.career.api.analysis import router as analysis_router
from app.modules.career.api.upload import router as upload_router
from app.modules.career.api.roadmap import router as roadmap_router
from app.modules.career.api.resume import router as resume_router
from app.modules.career.api.interview import router as interview_router

router = APIRouter(prefix="/career", tags=["Career"])

router.include_router(upload_router)
router.include_router(analysis_router)
router.include_router(roadmap_router)
router.include_router(resume_router)
router.include_router(interview_router)


@router.get("/health")
async def health() -> dict[str, str]:
    return {"module": "career", "status": "healthy"}