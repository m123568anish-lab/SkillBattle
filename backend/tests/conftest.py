"""
=========================================================

SkillBattle

Pytest Fixtures

=========================================================
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from database_isolation_support import TEST_DATABASE_URL

from app.main import app
from app.database.init_db import init_db


@pytest_asyncio.fixture(autouse=True)
def clean_dependency_overrides():
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()


@pytest.fixture(scope="session", autouse=True)
def initialize_test_database():
    init_db(database_url=TEST_DATABASE_URL)


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)

    async with AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as client:
        yield client


@pytest_asyncio.fixture
async def battle_question_bank():
    from uuid import uuid4

    from app.database.session import AsyncSessionLocal
    from app.models.question import Question

    suffix = uuid4().hex
    questions = []
    for index in range(5):
        questions.append(
            Question(
                title=f"Test MCQ {suffix}-{index}",
                slug=f"test-mcq-{suffix}-{index}",
                description="Synthetic test question with a valid description.",
                difficulty="medium",
                question_type="mcq",
                options=[{"key": "A", "text": "Option A"}, {"key": "B", "text": "Option B"}],
                correct_option="A",
                is_active=True,
                is_validated=True,
            )
        )
    for index in range(3):
        questions.append(
            Question(
                title=f"Test coding {suffix}-{index}",
                slug=f"test-coding-{suffix}-{index}",
                description="Synthetic coding test question description.",
                difficulty="medium",
                question_type="coding",
                hidden_test_cases=[{"input": "1", "output": "1"}],
                is_active=True,
                is_validated=True,
            )
        )
    questions.extend(
        [
            Question(
                title=f"Test debugging {suffix}",
                slug=f"test-debugging-{suffix}",
                description="Synthetic debugging test question description.",
                difficulty="medium",
                question_type="debugging",
                buggy_code="print('broken'",
                is_active=True,
                is_validated=True,
            ),
            Question(
                title=f"Test technical {suffix}",
                slug=f"test-technical-{suffix}",
                description="Synthetic technical test question description.",
                difficulty="medium",
                question_type="technical",
                explanation="Synthetic test explanation.",
                is_active=True,
                is_validated=True,
            ),
        ]
    )
    async with AsyncSessionLocal() as db:
        db.add_all(questions)
        await db.commit()