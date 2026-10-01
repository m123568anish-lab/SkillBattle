"""
=========================================================
SkillBattle V3 — Assessment Engine & Skill Intelligence Tests
=========================================================
"""

import pytest
from app.modules.assessment_engine.services.scoring_service import CentralizedScoringEngine
from app.modules.assessment_engine.services.sandbox_runner import SecureCodeRunner


def test_scoring_engine_mcq_evaluation():
    engine = CentralizedScoringEngine()

    # Correct single MCQ
    score, is_correct, msg = engine.evaluate_mcq("A", "A", max_marks=10.0, negative_marks=2.5)
    assert score == 10.0
    assert is_correct is True

    # Wrong single MCQ with negative marking
    score, is_correct, msg = engine.evaluate_mcq("B", "A", max_marks=10.0, negative_marks=2.5)
    assert score == -2.5
    assert is_correct is False


def test_scoring_engine_multiple_select_evaluation():
    engine = CentralizedScoringEngine()

    # Full correct
    score, is_correct, msg = engine.evaluate_multiple_select(["A", "B"], ["A", "B"], max_marks=10.0)
    assert score == 10.0
    assert is_correct is True

    # Partial correct
    score, is_correct, msg = engine.evaluate_multiple_select(["A"], ["A", "B"], max_marks=10.0)
    assert score == 5.0
    assert is_correct is False

    # Incorrect choice selected
    score, is_correct, msg = engine.evaluate_multiple_select(["A", "C"], ["A", "B"], max_marks=10.0, negative_marks=2.0)
    assert score == -2.0
    assert is_correct is False


def test_scoring_engine_coding_evaluation():
    engine = CentralizedScoringEngine()

    # 4/4 passed test cases
    score, is_correct, msg = engine.evaluate_coding_test_cases(4, 4, max_marks=20.0, execution_status="ACCEPTED")
    assert score == 20.0
    assert is_correct is True

    # 2/4 passed test cases (partial)
    score, is_correct, msg = engine.evaluate_coding_test_cases(2, 4, max_marks=20.0, execution_status="ACCEPTED")
    assert score == 10.0
    assert is_correct is False


def test_sandbox_runner_python_execution():
    runner = SecureCodeRunner()
    code = "def solution(a, b):\n    return a + b\n"
    test_cases = [
        {"input": "2\n3", "output": "5"},
        {"input": "10\n-5", "output": "5"},
    ]

    res = runner.run_code(code=code, language="python", test_cases=test_cases)
    assert res["passed_count"] == 2
    assert res["total_count"] == 2
    assert res["execution_status"] == "ACCEPTED"
