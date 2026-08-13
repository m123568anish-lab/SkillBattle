import subprocess

from app.modules.compiler.executors.base import BaseExecutor
from app.modules.compiler.schemas import ExecutionResult


class JavaScriptExecutor(BaseExecutor):

    FILE_NAME = "main.js"

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

            start = self.start_timer()

            process = subprocess.run(
                [
                    "node",
                    source_file,
                ],
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
                stderr="Node.js runtime not found.",
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