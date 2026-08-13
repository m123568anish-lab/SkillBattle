"""
=========================================================

Execution Result

=========================================================
"""

from dataclasses import dataclass


@dataclass(slots=True)
class ExecutionResult:

    success: bool

    stdout: str = ""

    stderr: str = ""

    exit_code: int = 0

    runtime_ms: float = 0

    memory_mb: float = 0

    timed_out: bool = False

    killed: bool = False