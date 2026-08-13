"""
=========================================================

Problem Validator

=========================================================
"""

from __future__ import annotations


class ProblemValidator:

    def validate(self, problem):

        if not problem.title.strip():
            raise ValueError("Title cannot be empty.")

        if not problem.statement.strip():
            raise ValueError("Problem statement cannot be empty.")

        if problem.time_limit <= 0:
            raise ValueError("Invalid time limit.")

        if problem.memory_limit <= 0:
            raise ValueError("Invalid memory limit.")

        return True


problem_validator = ProblemValidator()