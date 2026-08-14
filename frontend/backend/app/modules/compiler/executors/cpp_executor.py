import os
import subprocess

from app.modules.compiler.executors.base import BaseExecutor
from app.modules.compiler.schemas import ExecutionResult


class CppExecutor(BaseExecutor):

    FILE_NAME = "main.cpp"

    EXECUTABLE = "program.exe"

    def execute(
        self,
        source_code: str,
        stdin: str = "",
    ) -> ExecutionResult:

        workspace = self.create_workspace()

        try:

            source_file = self.save_source(
                workspace,
                self.FILE_NAME,
                source_code,
            )

            executable = os.path.join(
                workspace,
                self.EXECUTABLE,
            )

            compile_process = subprocess.run(
                [
                    "g++",
                    source_file,
                    "-o",
                    executable,
                ],
                capture_output=True,
                text=True,
            )

            if compile_process.returncode != 0:

                return ExecutionResult(
                    stdout="",
                    stderr=compile_process.stderr,
                    return_code=compile_process.returncode,
                    execution_time=0,
                    memory_used=0,
                )

            start = self.start_timer()

            process = subprocess.run(
                [executable],
                input=stdin,
                capture_output=True,
                text=True,
                timeout=self.timeout,
            )

            elapsed = self.stop_timer(start)

            return ExecutionResult(
                stdout=process.stdout,
                stderr=process.stderr,
                return_code=process.returncode,
                execution_time=elapsed,
                memory_used=0,
            )

        except subprocess.TimeoutExpired:

            return ExecutionResult(
                stdout="",
                stderr="Time Limit Exceeded",
                return_code=-1,
                execution_time=self.timeout * 1000,
                memory_used=0,
            )

        except FileNotFoundError:

            return ExecutionResult(
                stdout="",
                stderr="g++ compiler not found.",
                return_code=-1,
                execution_time=0,
                memory_used=0,
            )

        except Exception as e:

            return ExecutionResult(
                stdout="",
                stderr=str(e),
                return_code=-1,
                execution_time=0,
                memory_used=0,
            )

        finally:

            self.cleanup(workspace)