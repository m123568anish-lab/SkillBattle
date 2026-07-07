import sys
from pathlib import Path

from sqlalchemy.orm import Session

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.database.database import SessionLocal
from app.database.base import Base

from app.models.compiler import (
    Problem,
    TestCase,
)
from app.models.user import User


# Ensure the required tables exist before inserting data.
# Create the core user table first so foreign keys in compiler models resolve.
Base.metadata.create_all(bind=SessionLocal.kw["bind"], tables=[User.__table__])
Base.metadata.create_all(bind=SessionLocal.kw["bind"], tables=[Problem.__table__, TestCase.__table__])

db: Session = SessionLocal()


def add_problem(
    title,
    slug,
    difficulty,
    category,
    description,
    sample_input,
    sample_output,
    tests,
):
    problem = Problem(
        title=title,
        slug=slug,
        difficulty=difficulty,
        category=category,
        description=description,
        input_format="",
        output_format="",
        constraints="",
        sample_input=sample_input,
        sample_output=sample_output,
        explanation="",
        xp_reward=100,
    )

    db.add(problem)
    db.flush()

    for test in tests:

        testcase = TestCase(
            problem_id=problem.id,
            input_data=test["input"],
            expected_output=test["output"],
            is_sample=test["sample"],
        )

        db.add(testcase)


# ----------------------------------------------------
# Problem 1
# ----------------------------------------------------

add_problem(
    title="Two Sum",
    slug="two-sum",
    difficulty="Easy",
    category="Arrays",
    description="""
Given an array of integers and a target,
return indices of two numbers whose sum equals target.
""",
    sample_input="""
nums = [2,7,11,15]
target = 9
""",
    sample_output="""
0 1
""",
    tests=[
        {
            "input": "2 7 11 15\n9",
            "output": "0 1",
            "sample": True,
        },
        {
            "input": "3 2 4\n6",
            "output": "1 2",
            "sample": False,
        },
    ],
)

# ----------------------------------------------------
# Problem 2
# ----------------------------------------------------

add_problem(
    title="Binary Search",
    slug="binary-search",
    difficulty="Easy",
    category="Searching",
    description="""
Search target inside sorted array.
""",
    sample_input="""
1 2 3 4 5
4
""",
    sample_output="""
3
""",
    tests=[
        {
            "input": "1 2 3 4 5\n4",
            "output": "3",
            "sample": True,
        },
        {
            "input": "2 5 8 9 10\n10",
            "output": "4",
            "sample": False,
        },
    ],
)

db.commit()

print("Problems inserted successfully.")