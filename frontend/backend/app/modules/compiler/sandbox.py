import os
import shutil
import subprocess
import tempfile
import time
import uuid

from app.modules.compiler.schemas import (
    ExecutionResult,
)


class Sandbox:

    """
    Temporary local sandbox.

    This sandbox executes submitted code in an isolated local workspace.
    """

    FILES = {

        "python": "main.py",

        "cpp": "main.cpp",

        "c": "main.c",

        "java": "Main.java",

        "javascript": "main.js",

    }

    # ------------------------------------------

    def create_workspace(self):

        workspace = os.path.join(

            tempfile.gettempdir(),

            "skillbattle",

            str(uuid.uuid4()),

        )

        os.makedirs(

            workspace,

            exist_ok=True,

        )

        return workspace

    # ------------------------------------------

    def cleanup(self, workspace):

        shutil.rmtree(

            workspace,

            ignore_errors=True,

        )

    # ------------------------------------------

    def save_source(

        self,

        workspace,

        language,

        source_code,

    ):

        filename = self.FILES[language]

        path = os.path.join(

            workspace,

            filename,

        )

        with open(

            path,

            "w",

            encoding="utf-8",

        ) as f:

            f.write(source_code)

        return path

    # ------------------------------------------

    def run_python(

        self,

        source_path,

        stdin="",

    ):

        start = time.perf_counter()

        process = subprocess.run(

            [

                "python",

                source_path,

            ],

            input=stdin,

            capture_output=True,

            text=True,

            timeout=3,

        )

        elapsed = int(

            (time.perf_counter() - start)

            * 1000

        )

        return ExecutionResult(

            stdout=process.stdout,

            stderr=process.stderr,

            return_code=process.returncode,

            execution_time=elapsed,

            memory_used=0,

        )

    # ------------------------------------------

    def execute(

        self,

        language,

        source_code,

        stdin="",

    ):

        workspace = self.create_workspace()

        try:

            source = self.save_source(

                workspace,

                language,

                source_code,

            )

            if language == "python":

                return self.run_python(

                    source,

                    stdin,

                )
            # For unsupported languages return a structured ExecutionResult
            # with an explanatory error instead of raising. This keeps callers
            # from crashing and provides a clear message.
            return ExecutionResult(
                stdout="",
                stderr=f"Language not implemented: {language}",
                return_code=1,
                execution_time=0,
                memory_used=0,
            )

        finally:

            self.cleanup(

                workspace,

            )


sandbox = Sandbox()