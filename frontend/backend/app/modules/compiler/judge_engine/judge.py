from .execution_stats import ExecutionStats
from .score_calculator import calculate_score
from .testcase_runner import testcase_runner
from .verdict import Verdict


class JudgeEngine:

    def judge(

        self,

        language: str,

        source_code: str,

        test_cases,

    ):

        results = []

        passed = 0

        max_time = 0.0

        max_memory = 0

        final_verdict = Verdict.ACCEPTED

        for case in test_cases:

            result = testcase_runner.run(

                language,

                source_code,

                case,

            )

            results.append(result)

            max_time = max(

                max_time,

                result.execution_time,

            )

            if result.passed:

                passed += 1

            else:

                final_verdict = result.verdict

                break

        stats = ExecutionStats(

            execution_time=max_time,

            memory_used=max_memory,

            passed_tests=passed,

            total_tests=len(test_cases),

            score=calculate_score(

                passed,

                len(test_cases),

            ),

            verdict=final_verdict.value,

        )

        return {

            "statistics": stats,

            "results": results,

        }


judge_engine = JudgeEngine()