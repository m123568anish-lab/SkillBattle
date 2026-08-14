import subprocess
import time

from ..workspace import Workspace
from ..result import ExecutionResult


class CppRunner:

    def execute(

        self,

        source_code,

        stdin="",

    ):

        workspace = Workspace()

        try:

            source = workspace.file(
                "main.cpp"
            )

            exe = workspace.file(
                "main.exe"
            )

            source.write_text(
                source_code
            )

            compile_result = subprocess.run(

                [

                    "g++",

                    source,

                    "-o",

                    exe,

                ],

                capture_output=True,

                text=True,

            )

            if compile_result.returncode != 0:

                return ExecutionResult(

                    "",

                    compile_result.stderr,

                    0,

                    0,

                    1,

                )

            start = time.perf_counter()

            result = subprocess.run(

                [exe],

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

                result.stdout,

                result.stderr,

                elapsed,

                0,

                result.returncode,

            )

        finally:

            workspace.cleanup()