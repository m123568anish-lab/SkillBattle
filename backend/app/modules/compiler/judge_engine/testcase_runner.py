from dataclasses import dataclass

from app.modules.compiler.sandbox import sandbox

from .comparison import compare_output
from .verdict import Verdict


@dataclass
class TestCaseResult:

    passed: bool

    verdict: Verdict

    expected_output: str

    actual_output: str

    execution_time: float

    stderr: str


class TestCaseRunner:

    def run(

        self,

        language: str,

        source_code: str,

        test_case,

    ) -> TestCaseResult:

        result = sandbox.execute(

            language=language,

            source_code=source_code,

            stdin=test_case.input_data,

        )

        if not result.success:

            return TestCaseResult(

                passed=False,

                verdict=Verdict.RUNTIME_ERROR,

                expected_output=test_case.expected_output,

                actual_output=result.stdout,

                execution_time=result.execution_time,

                stderr=result.stderr,

            )

        passed = compare_output(

            test_case.expected_output,

            result.stdout,

        )

        return TestCaseResult(

            passed=passed,

            verdict=(
                Verdict.ACCEPTED
                if passed
                else Verdict.WRONG_ANSWER
            ),

            expected_output=test_case.expected_output,

            actual_output=result.stdout,

            execution_time=result.execution_time,

            stderr=result.stderr,

        )


testcase_runner = TestCaseRunner()