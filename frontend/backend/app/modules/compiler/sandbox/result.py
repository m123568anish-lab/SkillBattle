from dataclasses import dataclass


@dataclass
class SandboxResult:

    stdout: str

    stderr: str

    return_code: int

    execution_time: float

    memory_used: int

    success: bool