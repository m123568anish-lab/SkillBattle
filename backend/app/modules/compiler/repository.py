"""
=========================================================

SkillBattle

Compiler Repository

Production Async Repository

=========================================================
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.compiler import CodeSubmission


class CompilerRepository:

    async def create_submission(
        self,
        db: AsyncSession,
        submission: CodeSubmission,
    ) -> CodeSubmission:

        db.add(submission)

        await db.flush()

        await db.refresh(submission)

        return submission

    async def update_submission(
        self,
        db: AsyncSession,
        submission: CodeSubmission,
    ) -> CodeSubmission:

        db.add(submission)

        await db.flush()

        await db.refresh(submission)

        return submission

    async def get_submission(
        self,
        db: AsyncSession,
        submission_id: int,
    ) -> CodeSubmission | None:

        result = await db.execute(

            select(CodeSubmission).where(

                CodeSubmission.id == submission_id

            )

        )

        return result.scalar_one_or_none()

    async def get_user_submissions(
        self,
        db: AsyncSession,
        user_id: str,
    ):

        result = await db.execute(

            select(CodeSubmission)

            .where(

                CodeSubmission.user_id == user_id

            )

            .order_by(

                CodeSubmission.submitted_at.desc()

            )

        )

        return list(result.scalars().all())

    async def get_problem_submissions(
        self,
        db: AsyncSession,
        problem_id: int,
    ):

        result = await db.execute(

            select(CodeSubmission)

            .where(

                CodeSubmission.problem_id == problem_id

            )

            .order_by(

                CodeSubmission.submitted_at.desc()

            )

        )

        return list(result.scalars().all())


compiler_repository = CompilerRepository()