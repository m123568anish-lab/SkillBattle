"""
=========================================================

SkillBattle

Docker Runner

Production Version

=========================================================
"""

from __future__ import annotations

import subprocess
import tempfile
import shutil
import time
from pathlib import Path

from .limits import ExecutionLimits
from app.modules.compiler.executor.result import (
    ExecutionResult,
)


class DockerRunner:

    # =====================================================
    # Execute
    # =====================================================

    def run(

        self,

        image: str,

        compile_cmd: list[str] | None,

        run_cmd: list[str],

        filename: str,

        source_code: str,

        stdin: str,

        limits: ExecutionLimits,

    ) -> ExecutionResult:

        workspace = Path(

            tempfile.mkdtemp(
                prefix="skillbattle_",
            )

        )

        try:

            source = workspace / filename

            source.write_text(

                source_code,

                encoding="utf-8",

            )

            # --------------------------------------------
            # Compile
            # --------------------------------------------

            if compile_cmd:

                compile_result = subprocess.run(

                    [

                        "docker",

                        "run",

                        "--rm",

                        "-v",

                        f"{workspace}:/workspace",

                        image,

                        *compile_cmd,

                    ],

                    capture_output=True,

                    text=True,

                )

                if compile_result.returncode != 0:

                    return ExecutionResult(

                        success=False,

                        stderr=compile_result.stderr,

                        exit_code=compile_result.returncode,

                    )

            # --------------------------------------------
            # Execute
            # --------------------------------------------

            start = time.perf_counter()

            process = subprocess.run(

                [

                    "docker",

                    "run",

                    "--rm",

                    "--network",

                    "none",

                    "--memory",

                    f"{limits.memory_mb}m",

                    "--cpus",

                    str(limits.cpu_seconds),

                    "-v",

                    f"{workspace}:/workspace",

                    image,

                    *run_cmd,

                ],

                input=stdin,

                capture_output=True,

                text=True,

                timeout=limits.timeout_seconds,

            )

            runtime = (

                time.perf_counter()

                - start

            ) * 1000

            return ExecutionResult(

                success=process.returncode == 0,

                stdout=process.stdout,

                stderr=process.stderr,

                exit_code=process.returncode,

                runtime_ms=runtime,

                memory_mb=limits.memory_mb,

            )

        except subprocess.TimeoutExpired:

            return ExecutionResult(

                success=False,

                timed_out=True,

                stderr="Time Limit Exceeded",

                exit_code=-1,

            )

        finally:

            shutil.rmtree(

                workspace,

                ignore_errors=True,

            )


docker_runner = DockerRunner()