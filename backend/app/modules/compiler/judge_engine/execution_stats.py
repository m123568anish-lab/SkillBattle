from dataclasses import dataclass


@dataclass
class ExecutionStats:

    execution_time: float

    memory_used: int

    passed_tests: int

    total_tests: int

    score: float

    verdict: str

    stdout: str = ""

    stderr: str = ""