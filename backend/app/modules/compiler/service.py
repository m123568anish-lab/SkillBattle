"""
=========================================================

SkillBattle

Compiler Service

Production Version

=========================================================
"""

from __future__ import annotations

import logging
from urllib import request

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.compiler import (
    CodeSubmission,
)
from app.modules.battle.websocket import battle_ws

from app.modules.battle.events import BattleEvent
from app.modules.problem.repository import (
    problem_repository,
)

from app.modules.compiler.repository import (
    compiler_repository,
)

from app.modules.compiler.executor.execution_manager import (
    execution_manager,
)

from app.modules.compiler.judge import (
    judge_engine,
)

from app.modules.compiler.schemas import (
    RunCodeRequest,
    SubmitCodeRequest,
    RunCodeResponse,
    SubmitCodeResponse,
)

logger = logging.getLogger(__name__)


class CompilerService:

    # ==========================================================
    # Run Custom Code
    # ==========================================================

    async def run_code(
        self,
        request: RunCodeRequest,
    ) -> RunCodeResponse:

        logger.info(
            "Running custom code in %s",
            request.language,
        )

        result = execution_manager.execute(

            language=request.language,

            source_code=request.source_code,

            stdin=request.stdin,

        )

        status = "Success"

        if result.timed_out:

            status = "Time Limit Exceeded"

        elif not result.success:

            status = "Runtime Error"

        return RunCodeResponse(

            stdout=result.stdout,

            stderr=result.stderr,

            execution_time=int(
                result.runtime_ms
            ),

            memory_used=int(
                result.memory_mb
            ),

            status=status,

        )

    # ==========================================================
    # Get Problem
    # ==========================================================

    async def _get_problem(
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

        return problem

    # ==========================================================
    # Extract Hidden Tests
    # ==========================================================

    def _hidden_testcases(
        self,
        problem,
    ) -> list[dict]:

        tests = []

        for testcase in problem.test_cases:

            if getattr(
                testcase,
                "is_hidden",
                False,
            ):

                tests.append(
                    {
                        "input": testcase.input_data,
                        "output": testcase.expected_output,
                    }
                )

        return tests


        # ==========================================================
    # Submit Solution
    # ==========================================================

    async def submit_solution(
        self,
        db: AsyncSession,
        current_user,
        request: SubmitCodeRequest,
    ) -> SubmitCodeResponse:

        logger.info(

            "Submitting solution | user=%s problem=%s",

            current_user.id,

            request.problem_id,

        )

        # ------------------------------------------------------
        # Load Problem
        # ------------------------------------------------------

        problem = await self._get_problem(

            db,

            request.problem_id,

        )

        # ------------------------------------------------------
        # Hidden Test Cases
        # ------------------------------------------------------

        hidden_tests = self._hidden_testcases(
            problem,
        )

        if not hidden_tests:

            raise ValueError(
                "Problem has no hidden test cases."
            )

        # ------------------------------------------------------
        # Create Submission
        # ------------------------------------------------------

        submission = CodeSubmission(

            user_id=current_user.id,

            problem_id=request.problem_id,

            language=request.language,

            source_code=request.source_code,

            verdict="Pending",

            execution_time=0,

            memory_used=0,

            passed_tests=0,

            total_tests=len(hidden_tests),

        )

        submission = await compiler_repository.create_submission(

            db,

            submission,

        )

        # ------------------------------------------------------
        # Judge
        # ------------------------------------------------------

        judge_result = judge_engine.judge(

            language=request.language,

            source_code=request.source_code,

            testcases=hidden_tests,

        )

        # ------------------------------------------------------
        # Update Submission
        # ------------------------------------------------------

        submission.verdict = judge_result.verdict

        submission.execution_time = int(
            judge_result.runtime_ms
        )

        submission.memory_used = int(
            judge_result.memory_mb
        )

        submission.passed_tests = (
            judge_result.passed_tests
        )

        submission.total_tests = (
            judge_result.total_tests
        )

        await compiler_repository.update_submission(

            db,

            submission,

        )

        # ------------------------------------------------------
        # Commit
        # ------------------------------------------------------

        await db.commit()
        await self.notify_battle(

    getattr(request, "battle_id", None),

    submission.verdict,

)

        # ------------------------------------------------------
        # XP Placeholder
        # ------------------------------------------------------

        xp_earned = 0

        if judge_result.verdict == "Accepted":

            xp_earned = problem.xp_reward

        # ------------------------------------------------------
        # Response
        # ------------------------------------------------------

        return SubmitCodeResponse(

            submission_id=submission.id,

            verdict=submission.verdict,

            passed_tests=submission.passed_tests,

            total_tests=submission.total_tests,

            execution_time=submission.execution_time,

            memory_used=submission.memory_used,

            xp_earned=xp_earned,

        )
    
        # ==========================================================
    # User Submission History
    # ==========================================================

    async def get_user_submissions(
        self,
        db: AsyncSession,
        current_user,
    ):

        return await compiler_repository.get_user_submissions(
            db,
            current_user.id,
        )

    # ==========================================================
    # Problem Submission History
    # ==========================================================

    async def get_problem_submissions(
        self,
        db: AsyncSession,
        problem_id: int,
    ):

        return await compiler_repository.get_problem_submissions(
            db,
            problem_id,
        )

    # ==========================================================
    # XP Integration Hook
    # ==========================================================

    async def award_xp(
        self,
        db: AsyncSession,
        current_user,
        amount: int,
    ):

        """
        Placeholder.

        Replace this after the XP module is migrated
        to AsyncSession.

        Example:

        await xp_service.add_xp(...)
        """

        logger.info(

            "XP Hook | user=%s amount=%s",

            current_user.id,

            amount,

        )

        return amount

    # ==========================================================
    # Achievement Hook
    # ==========================================================

    async def unlock_achievements(
        self,
        db: AsyncSession,
        current_user,
    ):

        """
        Placeholder.

        Future:

        await achievement_service.check(...)
        """

        logger.info(

            "Achievement Hook | user=%s",

            current_user.id,

        )

        return []

    # ==========================================================
    # Battle Hook
    # ==========================================================

    async def notify_battle(
        self,
        battle_id: str | None,
        verdict: str,
    ):
        if battle_id is None:
            return

        await battle_ws.broadcast(
            battle_id,
            BattleEvent.SUBMISSION.value,
            {
                "verdict": verdict,
            },
        )

    # ==========================================================
    # Leaderboard Hook
    # ==========================================================

    async def update_leaderboard(
        self,
        current_user,
        xp: int,
    ):

        """
        Future integration.
        """

        logger.info(

            "Leaderboard Hook | user=%s xp=%s",

            current_user.id,

            xp,

        )

        return

    # ==========================================================
    # Compiler Health
    # ==========================================================

    async def health(self):

        return {

            "module": "compiler",

            "status": "healthy",
        }


compiler_service = CompilerService()