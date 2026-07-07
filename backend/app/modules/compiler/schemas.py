from datetime import datetime
from typing import List

from pydantic import BaseModel, Field


# ==========================================================
# Run Code
# ==========================================================

class RunCodeRequest(BaseModel):

    language: str

    source_code: str

    stdin: str = ""


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

    failed_test: int | None = None


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