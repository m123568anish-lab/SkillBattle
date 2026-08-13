"""
=========================================================

SkillBattle

AI Problem Generator Schemas

Production Version

=========================================================
"""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


# ==========================================================
# Difficulty
# ==========================================================

class Difficulty(str, Enum):
    EASY = "Easy"
    MEDIUM = "Medium"
    HARD = "Hard"
    EXPERT = "Expert"


# ==========================================================
# Topic
# ==========================================================

class Topic(str, Enum):
    ARRAY = "Array"
    STRING = "String"
    LINKED_LIST = "Linked List"
    STACK = "Stack"
    QUEUE = "Queue"
    TREE = "Tree"
    BST = "Binary Search Tree"
    GRAPH = "Graph"
    GREEDY = "Greedy"
    DYNAMIC_PROGRAMMING = "Dynamic Programming"
    BACKTRACKING = "Backtracking"
    HEAP = "Heap"
    TRIE = "Trie"
    BIT_MANIPULATION = "Bit Manipulation"
    MATH = "Math"
    SQL = "SQL"


# ==========================================================
# Generate Request
# ==========================================================

class GenerateProblemRequest(BaseModel):

    difficulty: Difficulty

    topic: Topic

    company: str | None = Field(
        default=None,
        max_length=100,
    )

    rating: int | None = Field(
        default=None,
        ge=800,
        le=3500,
    )


# ==========================================================
# Test Case
# ==========================================================

class TestCase(BaseModel):

    input: str

    output: str

    explanation: str | None = None


# ==========================================================
# Generated Problem
# ==========================================================

class GeneratedProblem(BaseModel):

    title: str

    difficulty: Difficulty

    topic: Topic

    statement: str

    constraints: str

    input_format: str

    output_format: str

    examples: list[TestCase]

    hidden_testcases: list[TestCase]

    starter_code: dict[str, str]

    solution: str

    editorial: str | None = None

    hints: list[str] = []

    estimated_rating: int

    tags: list[str] = []

    time_limit: int

    memory_limit: int

    model_config = {
        "from_attributes": True
    }


# ==========================================================
# AI Response
# ==========================================================

class AIProblemResponse(BaseModel):

    success: bool

    problem: GeneratedProblem

    generated_by: str = "SkillBattle AI"

    version: str = "1.0"