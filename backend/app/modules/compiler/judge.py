"""
=========================================================

SkillBattle

Judge Engine

Production Version

=========================================================
"""

from __future__ import annotations

from enum import Enum

from app.modules.compiler.executor.execution_manager import (
    execution_manager,
)

from app.modules.compiler.utils.compare import (
    compare_output,
)

from app.modules.compiler.schemas import (
    JudgeResult,
)


class Verdict(str, Enum):

    ACCEPTED = "Accepted"

    WRONG_ANSWER = "Wrong Answer"

    COMPILATION_ERROR = "Compilation Error"

    RUNTIME_ERROR = "Runtime Error"

    TIME_LIMIT_EXCEEDED = "Time Limit Exceeded"

    MEMORY_LIMIT_EXCEEDED = "Memory Limit Exceeded"

    OUTPUT_LIMIT_EXCEEDED = "Output Limit Exceeded"


class JudgeEngine:

    def judge(
        self,
        language: str,
        source_code: str,
        testcases: list[dict],
    ) -> JudgeResult:

        passed = 0

        runtime = 0.0

        memory = 0.0

        failed_test = None

        verdict = Verdict.ACCEPTED

        for index, testcase in enumerate(testcases):

            result = execution_manager.execute(

                language=language,

                source_code=source_code,

                stdin=testcase["input"],

            )

            runtime = max(
                runtime,
                result.runtime_ms,
            )

            memory = max(
                memory,
                result.memory_mb,
            )

            # ----------------------------
            # Time Limit
            # ----------------------------

            if result.timed_out:

                verdict = Verdict.TIME_LIMIT_EXCEEDED

                failed_test = index

                break

            # ----------------------------
            # Compilation Error
            # ----------------------------

            if (
                result.stderr
                and "error" in result.stderr.lower()
                and result.exit_code != 0
            ):

                verdict = Verdict.COMPILATION_ERROR

                failed_test = index

                break

            # ----------------------------
            # Runtime Error
            # ----------------------------

            if not result.success:

                verdict = Verdict.RUNTIME_ERROR

                failed_test = index

                break

            # ----------------------------
            # Wrong Answer
            # ----------------------------

            if not compare_output(

                testcase["output"],

                result.stdout,

            ):

                verdict = Verdict.WRONG_ANSWER

                failed_test = index

                break

            passed += 1

        score = int(

            passed * 100 / len(testcases)

        )

        return JudgeResult(

            verdict=verdict.value,

            passed_tests=passed,

            total_tests=len(testcases),

            runtime_ms=runtime,

            memory_mb=memory,

            score=score,

            failed_test_index=failed_test,

        )


judge_engine = JudgeEngine()