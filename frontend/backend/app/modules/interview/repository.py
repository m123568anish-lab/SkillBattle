"""
=========================================================

Interview Repository

=========================================================
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.interview.model import Interview


class InterviewRepository:

    async def create(

        self,

        db: AsyncSession,

        interview: Interview,

    ):

        db.add(interview)

        await db.flush()

        await db.refresh(interview)

        return interview

    async def get(

        self,

        db: AsyncSession,

        interview_id: str,

    ):

        result = await db.execute(

            select(Interview).where(

                Interview.id == interview_id,

            )

        )

        return result.scalar_one_or_none()

    async def commit(

        self,

        db: AsyncSession,

    ):

        await db.commit()


interview_repository = InterviewRepository()