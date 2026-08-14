import subprocess
import time

from ..workspace import Workspace
from ..result import ExecutionResult


class PythonRunner:

    def execute(

        self,

        source_code,

        stdin="",

    ):

        workspace = Workspace()

        try:

            code = workspace.file(
                "main.py"
            )

            code.write_text(
                source_code,
                encoding="utf8",
            )

            start = time.perf_counter()

            result = subprocess.run(

                ["python", code],

                input=stdin,

                capture_output=True,

                text=True,

                timeout=5,

            )

            elapsed = (
                time.perf_counter()
                - start
            )

            return ExecutionResult(

                stdout=result.stdout,

                stderr=result.stderr,

                execution_time=elapsed,

                memory_used=0,

                return_code=result.returncode,

            )

        finally:

            workspace.cleanup()