from __future__ import annotations

import asyncio
import json
import logging
import tempfile
import time
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.question import Question, UserSubmission
from app.models.user import User
from app.models.user_stats import UserStats

logger = logging.getLogger("uvicorn.error")
router = APIRouter(prefix="/api/battle", tags=["Battle Execution"])

LANGUAGE_CONFIG = {
    "python": ("python:3.12-alpine", "python3 /sandbox/main.py"),
    "javascript": ("node:22-alpine", "node /sandbox/main.js"),
    "cpp": ("gcc:13", "g++ -O2 -std=c++20 /sandbox/main.cpp -o /tmp/main && /tmp/main"),
    "java": ("eclipse-temurin:21-jdk", "javac /sandbox/Main.java && java -cp /sandbox Main"),
}


class SubmissionRequest(BaseModel):
    question_id: int
    language: str = Field(pattern="^(python|javascript|cpp|java)$")
    source_code: str = Field(min_length=1, max_length=100_000)
    submit: bool = True


def _test_cases(question: Question, submit: bool) -> list[dict]:
    examples = question.examples or []
    hidden = question.hidden_test_cases or []
    cases = hidden if submit else examples
    return [case for case in cases if isinstance(case, dict) and "input" in case and "output" in case]


async def _run_in_sandbox(language: str, source_code: str, test_case: dict) -> tuple[str, int]:
    image, command = LANGUAGE_CONFIG[language]
    extension = {"python": "py", "javascript": "js", "cpp": "cpp", "java": "java"}[language]
    filename = "Main.java" if language == "java" else f"main.{extension}"

    with tempfile.TemporaryDirectory(prefix="skillbattle-submit-") as directory:
        source_path = Path(directory) / filename
        source_path.write_text(source_code, encoding="utf-8")
        started = time.perf_counter()
        process = await asyncio.create_subprocess_exec(
            "docker", "run", "--rm", "--network", "none",
            "--cpus", "1", "--memory", "256m", "--pids-limit", "64",
            "--read-only", "--tmpfs", "/tmp:rw,noexec,nosuid,size=64m",
            "-v", f"{directory}:/sandbox:ro", image, "sh", "-lc",
            f"printf '%s' {json.dumps(str(test_case['input']))} | {command}",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=5)
        except asyncio.TimeoutError:
            process.kill()
            await process.wait()
            return "Execution timed out.", 5000
        elapsed = int((time.perf_counter() - started) * 1000)
        if process.returncode != 0:
            return stderr.decode(errors="replace")[-2000:] or "Execution failed.", elapsed
        return stdout.decode(errors="replace").strip(), elapsed


@router.post("/submit")
async def submit_solution(
    request: SubmissionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    question = await db.get(Question, request.question_id)
    if question is None or not question.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")

    cases = _test_cases(question, request.submit)
    if not cases:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Question has no executable test cases.")

    try:
        passed = 0
        elapsed = 0
        failure = None
        for case in cases:
            actual, duration = await _run_in_sandbox(request.language, request.source_code, case)
            elapsed += duration
            expected = str(case["output"]).strip()
            if actual == expected:
                passed += 1
            else:
                failure = {"expected": expected, "actual": actual}

        solved = request.submit and passed == len(cases)
        xp_earned = int(100 * (passed / len(cases))) if solved else 0
        submission = (
            await db.execute(
                select(UserSubmission).where(
                    UserSubmission.user_id == current_user.id,
                    UserSubmission.question_id == question.id,
                )
            )
        ).scalar_one_or_none()
        if submission is None:
            submission = UserSubmission(user_id=current_user.id, question_id=question.id, language=request.language, source_code=request.source_code)
            db.add(submission)
        submission.language = request.language
        submission.source_code = request.source_code
        submission.solved = bool(submission.solved or solved)
        submission.passed_tests = passed
        submission.total_tests = len(cases)
        submission.execution_time_ms = elapsed

        if solved:
            stats = (
                await db.execute(select(UserStats).where(UserStats.user_id == current_user.id))
            ).scalar_one_or_none()
            if stats is None:
                stats = UserStats(user_id=current_user.id)
                db.add(stats)
            stats.xp += xp_earned
            stats.level = max(1, stats.xp // 500 + 1)
            stats.rating += max(1, xp_earned // 10)
        await db.commit()
        return {
            "accepted": solved,
            "passed_tests": passed,
            "total_tests": len(cases),
            "execution_time_ms": elapsed,
            "xp_earned": xp_earned,
            "failure": failure,
        }
    except HTTPException:
        raise
    except Exception:
        await db.rollback()
        logger.exception("Battle execution failed for user_id=%s question_id=%s", current_user.id, question.id)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Execution service unavailable.")
