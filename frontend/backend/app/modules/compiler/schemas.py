from datetime import datetime
from typing import List

from pydantic import BaseModel, Field


# ==========================================================
# Run Code
# ==========================================================

class RunCodeRequest(BaseModel):

    language: str

    language_version: str | None = None

    source_code: str

    stdin: str = ""

    custom_input: bool = True

class RunCodeResponse(BaseModel):

    stdout: str

    stderr: str

    execution_time: int

    memory_used: int

    status: str


# ==========================================================
# Submit Code
# ==========================================================

class SubmitCodeRequest(BaseModel):

    problem_id: int

    language: str

    source_code: str

    battle_id: str | None = None

    contest_id: str | None = None


class SubmitCodeResponse(BaseModel):

    submission_id: int

    verdict: str

    passed_tests: int

    total_tests: int

    execution_time: int

    memory_used: int

    xp_earned: int


# ==========================================================
# Problem
# ==========================================================

class ProblemResponse(BaseModel):

    id: int

    title: str

    slug: str

    difficulty: str

    category: str

    description: str

    input_format: str

    output_format: str

    constraints: str

    sample_input: str

    sample_output: str

    explanation: str

    xp_reward: int

    model_config = {
        "from_attributes": True
    }


# ==========================================================
# Problem List
# ==========================================================

class ProblemListResponse(BaseModel):

    problems: List[ProblemResponse]


# ==========================================================
# Submission
# ==========================================================

class SubmissionResponse(BaseModel):

    id: int

    language: str

    verdict: str

    execution_time: int

    memory_used: int

    passed_tests: int

    total_tests: int

    submitted_at: datetime

    model_config = {
        "from_attributes": True
    }


# ==========================================================
# Judge Result
# ==========================================================

class JudgeResult(BaseModel):

    verdict: str

    passed_tests: int

    total_tests: int

    execution_time: int

    memory_used: int

    failed_test_index: int | None = None

    runtime_ms: float

    memory_mb: float

    score: int


# ==========================================================
# Test Case Result
# ==========================================================

class TestCaseResult(BaseModel):

    input: str

    expected_output: str

    actual_output: str

    passed: bool


# ==========================================================
# Execution Result
# ==========================================================

class ExecutionResult(BaseModel):

    stdout: str

    stderr: str

    return_code: int

    execution_time: int

    memory_used: int

# ==========================================================
# Compiler Error
# ==========================================================

class CompilerError(BaseModel):

    message: str

    line: int | None = None

    column: int | None = None

# ==========================================================
# Execution Limits
# ==========================================================

class ExecutionLimits(BaseModel):

    cpu_seconds: int

    memory_mb: int

    timeout_seconds: int

# ==========================================================
# Language
# ==========================================================

class LanguageInfo(BaseModel):

    id: str

    name: str

    version: str

    extension: str