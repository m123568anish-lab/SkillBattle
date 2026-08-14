"""
=========================================================

SkillBattle

Problem Generator Repository

=========================================================
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.problem import Problem
from app.models.problem_testcase import ProblemTestCase
from app.models.problem_starter_code import ProblemStarterCode
from app.models.problem_tag import ProblemTag


class ProblemGeneratorRepository:

    async def save_problem(
        self,
        db: AsyncSession,
        problem: Problem,
    ) -> Problem:

        db.add(problem)

        await db.flush()

        await db.refresh(problem)

        return problem

    async def save_testcase(
        self,
        db: AsyncSession,
        testcase: ProblemTestCase,
    ):

        db.add(testcase)

    async def save_starter_code(
        self,
        db: AsyncSession,
        starter: ProblemStarterCode,
    ):

        db.add(starter)

    async def save_tag(
        self,
        db: AsyncSession,
        tag: ProblemTag,
    ):

        db.add(tag)


problem_generator_repository = ProblemGeneratorRepository()