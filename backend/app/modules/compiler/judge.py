from app.modules.compiler.schemas import (
    JudgeResult,
)


class JudgeEngine:
    """
    Responsible for judging program output.
    """

    @staticmethod
    def normalize(text: str) -> str:
        """
        Remove extra spaces and blank lines.
        """

        return "\n".join(
            line.rstrip()
            for line in text.strip().splitlines()
        )

    def judge(
        self,
        results: list,
    ) -> JudgeResult:

        total = len(results)

        passed = 0

        execution_time = 0

        memory_used = 0

        failed_test = None

        verdict = "Accepted"

        for index, result in enumerate(results, start=1):

            execution_time = max(
                execution_time,
                result["execution_time"],
            )

            memory_used = max(
                memory_used,
                result["memory_used"],
            )

            if result["status"] != "SUCCESS":

                verdict = result["status"]

                failed_test = index

                break

            expected = self.normalize(
                result["expected_output"]
            )

            actual = self.normalize(
                result["actual_output"]
            )

            if expected == actual:

                passed += 1

            else:

                verdict = "Wrong Answer"

                failed_test = index

                break

        return JudgeResult(

            verdict=verdict,

            passed_tests=passed,

            total_tests=total,

            execution_time=execution_time,

            memory_used=memory_used,

            failed_test=failed_test,

        )


judge_engine = JudgeEngine()