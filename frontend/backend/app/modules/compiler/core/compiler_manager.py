"""
=========================================================
SkillBattle Compiler Manager
=========================================================

Responsibilities

✔ Compile C
✔ Compile C++
✔ Compile Java

Does NOT execute programs.

Execution is handled by ExecutionManager.

=========================================================
"""

from __future__ import annotations

import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from app.modules.compiler.core.language_registry import registry


# =========================================================
# Compilation Result
# =========================================================

@dataclass
class CompilationResult:

    success: bool

    executable: Optional[Path]

    stdout: str

    stderr: str

    return_code: int


# =========================================================
# Compiler Manager
# =========================================================

class CompilerManager:

    # -----------------------------------------------------
    # Public API
    # -----------------------------------------------------

    def compile(

        self,

        language: str,

        source: Path,

        workspace: Path,

    ) -> CompilationResult:

        language = language.lower()

        if language in ("python", "javascript"):

            return CompilationResult(

                success=True,

                executable=source,

                stdout="",

                stderr="",

                return_code=0,

            )

        if language == "cpp":

            return self._compile_cpp(

                source,

                workspace,

            )

        if language == "c":

            return self._compile_c(

                source,

                workspace,

            )

        if language == "java":

            return self._compile_java(

                source,

                workspace,

            )

        raise ValueError(

            f"Unsupported language: {language}"

        )

    # -----------------------------------------------------
    # C++
    # -----------------------------------------------------

    def _compile_cpp(

        self,

        source: Path,

        workspace: Path,

    ) -> CompilationResult:

        exe = workspace / "main.exe"

        result = subprocess.run(

            [

                "cl",

                "/EHsc",

                str(source),

                f"/Fe:{exe}",

            ],

            cwd=workspace,

            capture_output=True,

            text=True,

        )

        return CompilationResult(

            success=result.returncode == 0,

            executable=exe if result.returncode == 0 else None,

            stdout=result.stdout,

            stderr=result.stderr,

            return_code=result.returncode,

        )

    # -----------------------------------------------------
    # C
    # -----------------------------------------------------

    def _compile_c(

        self,

        source: Path,

        workspace: Path,

    ) -> CompilationResult:

        exe = workspace / "main.exe"

        result = subprocess.run(

            [

                "cl",

                str(source),

                f"/Fe:{exe}",

            ],

            cwd=workspace,

            capture_output=True,

            text=True,

        )

        return CompilationResult(

            success=result.returncode == 0,

            executable=exe if result.returncode == 0 else None,

            stdout=result.stdout,

            stderr=result.stderr,

            return_code=result.returncode,

        )

    # -----------------------------------------------------
    # Java
    # -----------------------------------------------------

    def _compile_java(

        self,

        source: Path,

        workspace: Path,

    ) -> CompilationResult:

        result = subprocess.run(

            [

                "javac",

                str(source),

            ],

            cwd=workspace,

            capture_output=True,

            text=True,

        )

        executable = workspace / "Main.class"

        return CompilationResult(

            success=result.returncode == 0,

            executable=executable if result.returncode == 0 else None,

            stdout=result.stdout,

            stderr=result.stderr,

            return_code=result.returncode,

        )


compiler_manager = CompilerManager()