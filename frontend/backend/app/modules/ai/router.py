"""
=========================================================

SkillBattle

AI Router

=========================================================
"""

from __future__ import annotations

from fastapi import (
    APIRouter,
)

from app.modules.ai.schemas import (
    AIChatRequest,
    RoadmapRequest,
    ResumeReviewRequest,
    InterviewRequest,
    RecommendationRequest,
)

from app.modules.ai.service import (
    ai_service,
)

router = APIRouter(

    prefix="/ai",

    tags=["AI"],

)


@router.get("/health")
async def health():

    return {

        "module": "ai",

        "status": "healthy",

    }


@router.post("/chat")
async def chat(
    request: AIChatRequest,
):

    return await ai_service.chat(
        request.message,
    )


@router.post("/roadmap")
async def roadmap(
    request: RoadmapRequest,
):

    return await ai_service.roadmap(
        request,
    )


@router.post("/resume")
async def resume(
    request: ResumeReviewRequest,
):

    return await ai_service.resume_review(
        request,
    )


@router.post("/interview")
async def interview(
    request: InterviewRequest,
):

    return await ai_service.interview(
        request,
    )


@router.post("/recommend")
async def recommend(
    request: RecommendationRequest,
):

    return await ai_service.recommend(
        request,
    )


@router.post("/rag")
async def rag(
    request: AIChatRequest,
):

    return await ai_service.rag(
        request.message,
    )