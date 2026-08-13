"""
=========================================================

SkillBattle

Interview Service

=========================================================
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User

from app.modules.interview.model import (
    Interview,
    InterviewStatus,
)

from app.modules.interview.repository import (
    interview_repository,
)

from app.modules.interview.schemas import (
    InterviewCreate,
)

from app.modules.interview.generator import (
    interview_generator,
)


class InterviewService:

    # =====================================================
    # Create Interview
    # =====================================================

    async def create_interview(
        self,
        db: AsyncSession,
        current_user: User,
        payload: InterviewCreate,
    ) -> Interview:

        interview = Interview(

            user_id=current_user.id,

            difficulty=payload.difficulty,

            language=payload.language,

            total_questions=payload.total_questions,

        )

        interview = await interview_repository.create(
            db,
            interview,
        )

        await interview_repository.commit(db)

        return interview

    # =====================================================
    # Start Interview
    # =====================================================

    async def start(
        self,
        db: AsyncSession,
        interview_id: str,
    ):

        interview = await interview_repository.get(
            db,
            interview_id,
        )

        interview.status = InterviewStatus.RUNNING

        await interview_repository.commit(db)

        return interview

    # =====================================================
    # Generate First Question
    # =====================================================

    async def first_question(
        self,
        interview: Interview,
    ):

        return await interview_generator.generate_question(
            difficulty=interview.difficulty,
            language=interview.language,
            topic="arrays",
        )


interview_service = InterviewService()