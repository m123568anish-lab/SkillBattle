"""
=========================================================

SkillBattle

Problem Repository

Production SQLAlchemy 2.x Async Repository

=========================================================
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.problem import Problem
from app.models.problem_testcase import ProblemTestCase
from app.models.problem_starter_code import ProblemStarterCode
from app.models.problem_tag import ProblemTag


class ProblemRepository:

    # ==========================================================
    # Create
    # ==========================================================

    async def create_problem(
        self,
        db: AsyncSession,
        problem: Problem,
    ) -> Problem:

        db.add(problem)

        await db.flush()

        await db.refresh(problem)

        return problem

    # ==========================================================
    # Update
    # ==========================================================

    async def update_problem(
        self,
        db: AsyncSession,
        problem: Problem,
    ) -> Problem:

        db.add(problem)

        await db.flush()

        await db.refresh(problem)

        return problem

    # ==========================================================
    # Delete
    # ==========================================================

    async def delete_problem(
        self,
        db: AsyncSession,
        problem: Problem,
    ):

        await db.delete(problem)

        await db.flush()

    # ==========================================================
    # Get By ID
    # ==========================================================

    async def get_problem(
        self,
        db: AsyncSession,
        problem_id: int,
    ) -> Problem | None:

        result = await db.execute(

            select(Problem)

            .options(

                selectinload(Problem.test_cases),

                selectinload(Problem.starter_codes),

                selectinload(Problem.tags),

            )

            .where(

                Problem.id == problem_id

            )

        )

        return result.scalar_one_or_none()

    # ==========================================================
    # Get By Slug
    # ==========================================================

    async def get_problem_by_slug(
        self,
        db: AsyncSession,
        slug: str,
    ) -> Problem | None:

        result = await db.execute(

            select(Problem)

            .where(

                Problem.slug == slug

            )

        )

        return result.scalar_one_or_none()

    # ==========================================================
    # List Problems
    # ==========================================================

    async def list_problems(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Problem]:

        result = await db.execute(

            select(Problem)

            .offset(skip)

            .limit(limit)

            .order_by(

                Problem.created_at.desc()

            )

        )

        return list(

            result.scalars().all()

        )

    # ==========================================================
    # Search
    # ==========================================================

    async def search(
        self,
        db: AsyncSession,
        keyword: str,
    ) -> list[Problem]:

        result = await db.execute(

            select(Problem)

            .where(

                Problem.title.ilike(

                    f"%{keyword}%"

                )

            )

        )

        return list(

            result.scalars().all()

        )

    # ==========================================================
    # Difficulty
    # ==========================================================

    async def by_difficulty(
        self,
        db: AsyncSession,
        difficulty: str,
    ):

        result = await db.execute(

            select(Problem)

            .where(

                Problem.difficulty == difficulty

            )

        )

        return list(

            result.scalars().all()

        )

    # ==========================================================
    # Category
    # ==========================================================

    async def by_category(
        self,
        db: AsyncSession,
        category: str,
    ):

        result = await db.execute(

            select(Problem)

            .where(

                Problem.category == category

            )

        )

        return list(

            result.scalars().all()

        )

    # ==========================================================
    # Test Cases
    # ==========================================================

    async def get_test_cases(
        self,
        db: AsyncSession,
        problem_id: int,
        hidden: bool | None = None,
    ):

        stmt = select(

            ProblemTestCase

        ).where(

            ProblemTestCase.problem_id == problem_id

        )

        if hidden is not None:

            stmt = stmt.where(

                ProblemTestCase.is_hidden == hidden

            )

        result = await db.execute(stmt)

        return list(

            result.scalars().all()

        )

    # ==========================================================
    # Starter Code
    # ==========================================================

    async def get_starter_code(
        self,
        db: AsyncSession,
        problem_id: int,
    ):

        result = await db.execute(

            select(

                ProblemStarterCode

            )

            .where(

                ProblemStarterCode.problem_id == problem_id

            )

        )

        return list(

            result.scalars().all()

        )

    # ==========================================================
    # Tags
    # ==========================================================

    async def get_tags(
        self,
        db: AsyncSession,
        problem_id: int,
    ):

        result = await db.execute(

            select(

                ProblemTag

            )

            .where(

                ProblemTag.problem_id == problem_id

            )

        )

        return list(

            result.scalars().all()

        )


problem_repository = ProblemRepository()