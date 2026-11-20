import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.database.init_db  # noqa: F401
from app.database.base import Base
from app.models.question import Question
from app.modules.battle.question_engine import question_engine
from app.modules.placement.intelligence_service import (
    get_company_catalog,
    get_question_source_catalog,
    get_topic_taxonomy,
)
from app.modules.placement.question_catalog_service import placement_question_catalog_service


def test_company_catalog_includes_core_placement_companies():
    catalog = get_company_catalog()
    names = {company["name"] for company in catalog}

    assert "Google" in names
    assert "Microsoft" in names
    assert "Amazon" in names
    assert "TCS" in names


def test_taxonomy_exposes_expected_topic_groups_and_topics():
    taxonomy = get_topic_taxonomy()

    assert "Programming and DSA" in taxonomy
    assert "Arrays" in taxonomy["Programming and DSA"]
    assert "Dynamic Programming" in taxonomy["Programming and DSA"]
    assert "SQL" in taxonomy["Core Computer Science"]
    assert "System Design" in taxonomy["Development and Engineering"]


def test_source_catalog_covers_all_question_types():
    sources = get_question_source_catalog()
    source_ids = {source["id"] for source in sources}

    assert {"verified-public-material", "community-reported", "ai-generated", "existing-inventory"} <= source_ids


@pytest.mark.asyncio
async def test_catalog_service_persists_approved_questions_and_deduplicates_duplicates():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        payload = {
            "title": "Google SDE Arrays MCQ",
            "description": "Which array operation has O(1) time complexity on average when accessing by index?",
            "difficulty": "medium",
            "question_type": "mcq",
            "company": "Google",
            "role": "SDE",
            "topic": "Arrays",
            "subtopic": "Indexing",
            "source_url": "https://example.test/google-arrays",
            "source_classification": "official-public-material",
            "license": "Public reference",
            "options": [
                {"key": "A", "text": "Linear scan"},
                {"key": "B", "text": "Hash lookup"},
                {"key": "C", "text": "Index access"},
                {"key": "D", "text": "Binary search"},
            ],
            "correct_option": "C",
            "skill_category": "Arrays",
            "question_kind": "mcq",
        }

        first = await placement_question_catalog_service.ingest_question(session, payload)
        assert first["status"] == "approved"
        assert first["question"].is_validated is True

        dup = await placement_question_catalog_service.ingest_question(session, {**payload, "title": "Google SDE Arrays MCQ (duplicate title)"})
        assert dup["status"] == "duplicate"
        assert dup["duplicate_of_id"] == first["question"].id

        invalid = await placement_question_catalog_service.ingest_question(
            session,
            {
                **payload,
                "title": "Google SDE invalid",
                "description": "Short",
                "correct_option": "",
            },
        )
        assert invalid["status"] == "needs_review"
        assert invalid["question"].is_validated is False

        inventory = await placement_question_catalog_service.list_inventory(session, company="Google")
        assert any(item["id"] == first["question"].id for item in inventory)
        assert all(item["approval_status"] != "duplicate" for item in inventory)

        approved_rows = await session.execute(select(Question).where(Question.is_validated.is_(True), Question.is_active.is_(True)))
        approved = approved_rows.scalars().all()
        assert len(approved) >= 1

        sections = await question_engine.resolve_questions_for_sections(
            session,
            [{"title": "Google MCQ", "question_type": "mcq", "question_count": 1, "difficulty": "medium"}],
            difficulty="medium",
        )
        assert sections and sections[0]["questions"]

    await engine.dispose()
