"""
=========================================================

SkillBattle

AI Service

Production Version

=========================================================
"""

from __future__ import annotations

from app.modules.ai.provider import (
    ai_provider,
)

from app.modules.ai.roadmap import (
    roadmap_generator,
)

from app.modules.ai.resume import (
    resume_ai,
)

from app.modules.ai.interview import (
    interview_coach,
)

from app.modules.ai.recommender import (
    learning_recommender,
)

from app.modules.ai.rag import (
    rag_engine,
)


class AIService:

    # =====================================================
    # Chat
    # =====================================================

    async def chat(
        self,
        message: str,
    ):

        return {

            "response": await ai_provider.generate(

                message,

            )

        }

    # =====================================================
    # Roadmap
    # =====================================================

    async def roadmap(
        self,
        request,
    ):

        return {

            "roadmap": await roadmap_generator.generate(

                request.target_role,

                request.current_level,

                request.weekly_hours,

            )

        }

    # =====================================================
    # Resume
    # =====================================================

    async def resume_review(
        self,
        request,
    ):

        return {

            "review": await resume_ai.review(

                request.resume_text,

            )

        }

    # =====================================================
    # Interview
    # =====================================================

    async def interview(
        self,
        request,
    ):

        return {

            "questions": await interview_coach.generate(

                request.role,

            )

        }

    # =====================================================
    # Recommendation
    # =====================================================

    async def recommend(
        self,
        request,
    ):

        return {

            "recommendation": await learning_recommender.recommend(

                request.topic,

            )

        }

    # =====================================================
    # RAG Chat
    # =====================================================

    async def rag(
        self,
        question: str,
    ):

        return {

            "response": await rag_engine.ask(

                question,

            )

        }


ai_service = AIService()