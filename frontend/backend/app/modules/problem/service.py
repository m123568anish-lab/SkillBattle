"""
=========================================================

SkillBattle

Problem Service

Production Version

=========================================================
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.problem import Problem

from .repository import problem_repository

from .schemas import (
    CreateProblemRequest,
    UpdateProblemRequest,
)


class ProblemService:

    # ==========================================================
    # Create
    # ==========================================================

    async def create_problem(
        self,
        db: AsyncSession,
        request: CreateProblemRequest,
    ) -> Problem:

        problem = Problem(

            title=request.title,

            slug=request.slug,

            difficulty=request.difficulty,

            category=request.category,

            description=request.description,

            input_format=request.input_format,

            output_format=request.output_format,

            constraints=request.constraints,

            explanation=request.explanation,

            xp_reward=request.xp_reward,

            time_limit=request.time_limit,

            memory_limit=request.memory_limit,

        )

        problem = await problem_repository.create_problem(

            db,

            problem,

        )

        await db.commit()

        return problem

    # ==========================================================
    # Update
    # ==========================================================

    async def update_problem(
        self,
        db: AsyncSession,
        problem_id: int,
        request: UpdateProblemRequest,
    ):

        problem = await problem_repository.get_problem(
            db,
            problem_id,
        )

        if problem is None:

            raise ValueError(
                "Problem not found."
            )

        for field, value in request.model_dump(
            exclude_unset=True
        ).items():

            setattr(
                problem,
                field,
                value,
            )

        await problem_repository.update_problem(
            db,
            problem,
        )

        await db.commit()

        return problem

    # ==========================================================
    # Delete
    # ==========================================================

    async def delete_problem(
        self,
        db: AsyncSession,
        problem_id: int,
    ):

        problem = await problem_repository.get_problem(
            db,
            problem_id,
        )

        if problem is None:

            raise ValueError(
                "Problem not found."
            )

        await problem_repository.delete_problem(
            db,
            problem,
        )

        await db.commit()

    # ==========================================================
    # Read
    # ==========================================================

    async def get_problem(
        self,
        db: AsyncSession,
        problem_id: int,
    ):

        return await problem_repository.get_problem(
            db,
            problem_id,
        )

    async def list_problems(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20,
    ):

        return await problem_repository.list_problems(
            db,
            skip,
            limit,
        )

    async def search(
        self,
        db: AsyncSession,
        keyword: str,
    ):

        return await problem_repository.search(
            db,
            keyword,
        )

    async def by_difficulty(
        self,
        db: AsyncSession,
        difficulty: str,
    ):

        return await problem_repository.by_difficulty(
            db,
            difficulty,
        )

    async def by_category(
        self,
        db: AsyncSession,
        category: str,
    ):

        return await problem_repository.by_category(
            db,
            category,
        )


problem_service = ProblemService()