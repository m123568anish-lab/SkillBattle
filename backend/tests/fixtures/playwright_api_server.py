import asyncio
import os
import sys
import uuid
from pathlib import Path

import uvicorn

backend_root = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(backend_root))
sys.path.insert(0, str(backend_root / "tests"))

from database_isolation_support import TEST_DATABASE_URL

from app.database.init_db import init_db

init_db(database_url=TEST_DATABASE_URL)

from app.database.session import AsyncSessionLocal
from app.main import app
from app.models.question import Question


async def seed_questions() -> None:
    suffix = uuid.uuid4().hex
    async with AsyncSessionLocal() as db:
        db.add_all(
            [
                Question(
                    title=f"Playwright MCQ {suffix}-{index}",
                    slug=f"playwright-mcq-{suffix}-{index}",
                    description=f"Select the verified answer for seeded browser question {index}.",
                    difficulty="medium",
                    question_type="mcq",
                    options=[
                        {"key": "A", "text": "Verified answer"},
                        {"key": "B", "text": "Alternative answer"},
                    ],
                    correct_option="A",
                    skill_category="Algorithms & Data Structures",
                    is_active=True,
                    is_validated=True,
                )
                for index in range(12)
            ]
            + [
                Question(
                    title=f"Playwright coding {suffix}-{index}",
                    slug=f"playwright-coding-{suffix}-{index}",
                    description="Read one integer from standard input and print the same integer.",
                    difficulty="medium",
                    question_type="coding",
                    examples=[{"input": "1\n", "output": "1\n"}],
                    hidden_test_cases=[
                        {"input": "1\n", "output": "1\n"},
                        {"input": "42\n", "output": "42\n"},
                    ],
                    skill_category="Problem Solving",
                    is_active=True,
                    is_validated=True,
                )
                for index in range(8)
            ]
        )
        await db.commit()


asyncio.run(seed_questions())
uvicorn.run(
    app,
    host="127.0.0.1",
    port=int(os.environ.get("QUBIRA_PLAYWRIGHT_API_PORT", "8000")),
    log_level="warning",
)
