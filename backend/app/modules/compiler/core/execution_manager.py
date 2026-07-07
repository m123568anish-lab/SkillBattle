"""
=========================================================
SkillBattle Execution Manager
=========================================================

Responsibilities

✔ Execute Python
✔ Execute JavaScript
✔ Execute Java
✔ Execute Compiled Programs

✔ Capture stdout
✔ Capture stderr
✔ Capture exit code
✔ Measure execution time

=========================================================
"""

from __future__ import annotations

import subprocess
import time
from pathlib import Path
from dataclasses import dataclass
from typing import Optional

from app.modules.compiler.core.compiler_manager import (
    compiler_manager,
)


# =========================================================
# Execution Result
# =========================================================

@dataclass
class ExecutionResult:

    success: bool

    stdout: str

    stderr: str

    return_code: int

    execution_time: float


# =========================================================
# Execution Manager
# =========================================================

class ExecutionManager:

    DEFAULT_TIMEOUT = 5

    # -----------------------------------------------------

    def execute(

        self,

        language: str,

        source: Path,

        workspace: Path,

        stdin: str = "",

        timeout: Optional[int] = None,

    ) -> ExecutionResult:

        timeout = timeout or self.DEFAULT_TIMEOUT

        compilation = compiler_manager.compile(

            language,

            source,

            workspace,

        )

        if not compilation.success:

            return ExecutionResult(

                success=False,

                stdout=compilation.stdout,

                stderr=compilation.stderr,

                return_code=compilation.return_code,

                execution_time=0,

            )

        language = language.lower()

        if language == "python":

            command = [

                "python",

                str(source),

            ]

        elif language == "javascript":

            command = [

                "node",

                str(source),

            ]

        elif language == "java":

            command = [

                "java",

                "-cp",

                str(workspace),

                "Main",

            ]

        else:

            command = [

                str(compilation.executable),

            ]

        try:

            start = time.perf_counter()

            result = subprocess.run(

                command,

                cwd=workspace,

                input=stdin,

                capture_output=True,

                text=True,

                timeout=timeout,

            )

            elapsed = (

                time.perf_counter()

                - start

            )

            return ExecutionResult(

                success=result.returncode == 0,

                stdout=result.stdout,

                stderr=result.stderr,

                return_code=result.returncode,

                execution_time=elapsed,

            )

        except subprocess.TimeoutExpired:

            return ExecutionResult(

                success=False,

                stdout="",

                stderr="Execution Timed Out",

                return_code=-1,

                execution_time=timeout,

            )

        except Exception as exc:

            return ExecutionResult(

                success=False,

                stdout="",

                stderr=str(exc),

                return_code=-1,

                execution_time=0,

            )


execution_manager = ExecutionManager()