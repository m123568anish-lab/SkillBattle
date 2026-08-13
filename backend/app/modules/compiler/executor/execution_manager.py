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

from app.modules.compiler.docker import (

    docker_runner,

    ExecutionLimits,

)


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

        return docker_runner.run(

            image=config["image"],

            compile_cmd=config["compile"],

            run_cmd=config["run"],

            filename=filename,

            source_code=source_code,

            stdin=stdin,

            limits=limits,

        )


execution_manager = ExecutionManager()