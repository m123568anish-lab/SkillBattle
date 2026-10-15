"""
=========================================================

SkillBattle

Execution Manager

=========================================================
"""

from __future__ import annotations

from app.modules.compiler.languages import (
    LANGUAGES,
)

from app.modules.compiler.docker.docker_runner import docker_runner
from app.modules.compiler.docker.limits import ExecutionLimits
from app.modules.compiler.executor.result import ExecutionResult
from app.modules.compiler.executors.manager import execution_manager as host_executor


class ExecutionManager:

    def execute(

        self,

        language: str,

        source_code: str,

        stdin: str = "",

    ):

        if language not in LANGUAGES:

            raise ValueError(

                f"Unsupported language: {language}"

            )

        config = LANGUAGES[language]

        filename = (

            "Main"

            + config["extension"]

        )

        limits = ExecutionLimits(

            timeout_seconds=config["timeout"],

            memory_mb=config["memory"],

        )

        try:
            return docker_runner.run(

                image=config["image"],

                compile_cmd=config["compile"],

                run_cmd=config["run"],

                filename=filename,

                source_code=source_code,

                stdin=stdin,

                limits=limits,

            )
        except Exception:
            host_res = host_executor.execute(
                language=language,
                source_code=source_code,
                stdin=stdin,
            )
            return ExecutionResult(
                success=host_res.return_code == 0,
                stdout=host_res.stdout,
                stderr=host_res.stderr,
                exit_code=host_res.return_code,
                runtime_ms=float(host_res.execution_time),
                memory_mb=float(host_res.memory_used or limits.memory_mb),
                timed_out=host_res.stderr == "Time Limit Exceeded" or host_res.return_code == -1,
            )


execution_manager = ExecutionManager()