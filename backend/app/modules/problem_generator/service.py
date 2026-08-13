"""
=========================================================

SkillBattle

AI Problem Generator Service

Production Version

=========================================================
"""

from __future__ import annotations

import json
import logging

from app.ai.client import ai_client

from .builder import build_prompt
from .prompts import SYSTEM_PROMPT
from .schemas import (
    AIProblemResponse,
    Difficulty,
    GeneratedProblem,
    Topic,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.problem import Problem
from app.models.problem_testcase import ProblemTestCase
from app.models.problem_starter_code import ProblemStarterCode
from app.models.problem_tag import ProblemTag

from .repository import problem_generator_repository

logger = logging.getLogger(__name__)


class ProblemGeneratorService:
    """
    AI powered coding problem generator.
    """

    MAX_RETRIES = 2

    # ==========================================================
    # Generate Problem
    # ==========================================================

    async def generate(
        self,
        difficulty: Difficulty,
        topic: Topic,
        company: str | None = None,
        rating: int | None = None,
    ) -> AIProblemResponse:

        prompt = build_prompt(
            difficulty=difficulty.value,
            topic=topic.value,
            company=company,
            rating=rating,
        )

        last_error = None

        for attempt in range(self.MAX_RETRIES + 1):

            try:

                logger.info(
                    "Generating AI problem (attempt %s)",
                    attempt + 1,
                )

                response = await ai_client.chat(

                    system_prompt=SYSTEM_PROMPT,

                    user_prompt=prompt,

                )

                data = self._parse_response(
                    response,
                )

                problem = GeneratedProblem.model_validate(
                    data,
                )

                logger.info(
                    "Problem generated successfully."
                )

                return AIProblemResponse(

                    success=True,

                    problem=problem,

                )

            except Exception as exc:

                logger.exception(
                    "Problem generation failed."
                )

                last_error = exc

        raise RuntimeError(
            f"Problem generation failed: {last_error}"
        )

    # ==========================================================
    # Parse Response
    # ==========================================================

    def _parse_response(
        self,
        response: str,
    ) -> dict:

        response = response.strip()

        if response.startswith("```json"):

            response = response.replace(
                "```json",
                "",
            )

            response = response.replace(
                "```",
                "",
            )

        try:

            return json.loads(response)

        except json.JSONDecodeError as exc:

            logger.error(
                "Invalid AI JSON response."
            )

            raise ValueError(
                "AI returned invalid JSON."
            ) from exc
async def generate_and_save(
    self,
    db: AsyncSession,
    difficulty,
    topic,
    company=None,
    rating=None,
):

    response = await self.generate(
        difficulty=difficulty,
        topic=topic,
        company=company,
        rating=rating,
    )

    data = response.problem

    problem = Problem(

        title=data.title,

        slug=data.title.lower().replace(" ", "-"),

        difficulty=data.difficulty.value,

        category=data.topic.value,

        description=data.statement,

        input_format=data.input_format,

        output_format=data.output_format,

        constraints=data.constraints,

        explanation=data.editorial,

        xp_reward=100,

        time_limit=data.time_limit,

        memory_limit=data.memory_limit,

    )

    problem = await problem_generator_repository.save_problem(
        db,
        problem,
    )

    for test in data.examples:

        await problem_generator_repository.save_testcase(

            db,

            ProblemTestCase(

                problem_id=problem.id,

                input_data=test.input,

                expected_output=test.output,

                is_hidden=False,

                explanation=test.explanation or "",

            ),

        )

    for test in data.hidden_testcases:

        await problem_generator_repository.save_testcase(

            db,

            ProblemTestCase(

                problem_id=problem.id,

                input_data=test.input,

                expected_output=test.output,

                is_hidden=True,

            ),

        )

    for language, code in data.starter_code.items():

        await problem_generator_repository.save_starter_code(

            db,

            ProblemStarterCode(

                problem_id=problem.id,

                language=language,

                code=code,

            ),

        )

    for tag in data.tags:

        await problem_generator_repository.save_tag(

            db,

            ProblemTag(

                problem_id=problem.id,

                tag=tag,

            ),

        )

    await db.commit()

    await db.refresh(problem)

    return {

        "success": True,

        "problem_id": problem.id,

        "title": problem.title,

    }

problem_generator_service = ProblemGeneratorService()