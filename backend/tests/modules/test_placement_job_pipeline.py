from __future__ import annotations

import json
from datetime import datetime, timedelta
from types import SimpleNamespace

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.database.init_db  # noqa: F401
from app.database.base import Base
from app.models.placement_jobs import PlacementInventoryTarget, PlacementJob
from app.models.question import Question
from app.modules.placement.inventory_service import placement_inventory_service
from app.modules.placement.job_service import placement_job_service
from app.modules.placement.source_connector import public_source_connector


@pytest.mark.asyncio
async def test_job_claim_and_retry_flow():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as session:
        job = await placement_job_service.create_job(
            session,
            "question-generation",
            {"company": "Google", "topic": "Arrays", "question_type": "mcq"},
            idempotency_key="job-claim-test",
        )
        assert job.status == "queued"

        first_claim = await placement_job_service.claim_next_job(session, "worker-a")
        assert first_claim is not None
        assert first_claim.status == "running"

        second_claim = await placement_job_service.claim_next_job(session, "worker-b")
        assert second_claim is None

        retriable = await placement_job_service.mark_failure(session, first_claim, ValueError("temporary error"), retryable=True)
        assert retriable.status == "queued"
        assert retriable.retry_count == 1

        retried = await placement_job_service.retry_job(session, retriable.id)
        assert retried.status == "queued"
        assert retried.retry_count == 2

    await engine.dispose()


@pytest.mark.asyncio
async def test_manual_retry_reopens_exhausted_failed_job():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as session:
        job = await placement_job_service.create_job(
            session,
            "question-generation",
            {"company": "Google", "topic": "Arrays", "question_type": "mcq"},
            idempotency_key="manual-retry-exhausted-job",
            max_retries=1,
        )
        job.status = "failed"
        job.retry_count = 1
        job.max_retries = 1
        await session.commit()

        retried = await placement_job_service.retry_job(session, job.id)
        assert retried.status == "queued"
        assert retried.retry_count == 2
        assert retried.max_retries == 3
        assert await placement_job_service.claim_next_job(session, "manual-retry-worker") is not None

    await engine.dispose()


@pytest.mark.asyncio
async def test_expired_running_jobs_are_recovered_by_new_worker():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as session:
        job = await placement_job_service.create_job(
            session,
            "question-generation",
            {"company": "Google", "topic": "Trees", "question_type": "mcq"},
            idempotency_key="job-recovery-test",
        )
        job.status = "running"
        job.worker_name = "stale-worker"
        job.lock_expires_at = datetime.utcnow() - timedelta(seconds=5)
        job.started_at = datetime.utcnow() - timedelta(seconds=10)
        await session.commit()

        recovered = await placement_job_service.claim_next_job(session, "fresh-worker")
        assert recovered is not None
        assert recovered.status == "running"
        assert recovered.worker_name == "fresh-worker"

    await engine.dispose()


@pytest.mark.asyncio
async def test_public_source_connector_fetches_and_records_permitted_resource(monkeypatch):
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    class FakeResponse:
        text = "<html><head><title>Google SDE Preparation</title></head><body>Topics include Arrays, SQL, Trees and System Design.</body></html>"

        def raise_for_status(self):
            return None

    async def fake_get(self, url):
        assert "google.com" in url
        return FakeResponse()

    monkeypatch.setattr("app.modules.placement.source_connector.httpx.AsyncClient.get", fake_get)

    async with session_factory() as session:
        record = await public_source_connector.fetch_and_record(
            session,
            "https://www.google.com/careers/prep",
            company="Google",
            role="SDE",
        )
        assert record.source_url == "https://www.google.com/careers/prep"
        assert record.processed is True
        assert {"Arrays", "SQL", "Trees", "System Design"}.intersection(set(record.extracted_topics))

        duplicate = await public_source_connector.fetch_and_record(
            session,
            "https://www.google.com/careers/prep",
            company="Google",
            role="SDE",
        )
        assert duplicate.id == record.id

    await engine.dispose()


@pytest.mark.asyncio
async def test_generation_job_calls_llm_and_persists_valid_question(monkeypatch):
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async def fake_generate(prompt: str):
        return json.dumps({
            "title": "Google Arrays Common Prefix",
            "description": "Which array operation is O(1) average time when accessed by index?",
            "difficulty": "medium",
            "question_type": "mcq",
            "company": "Google",
            "role": "SDE",
            "topic": "Arrays",
            "subtopic": "Indexing",
            "source_url": "https://example.test/google-arrays",
            "source_classification": "ai-generated",
            "license": "AI-generated internal practice",
            "options": [
                {"key": "A", "text": "Linear search"},
                {"key": "B", "text": "Index access"},
                {"key": "C", "text": "Merge sort"},
                {"key": "D", "text": "Hash map"},
            ],
            "correct_option": "B",
            "constraints": "N/A",
            "explanation": "Direct indexing is O(1) average time.",
            "skill_category": "Arrays",
            "is_ai_generated": True,
            "is_validated": False,
        })

    monkeypatch.setattr("app.modules.placement.job_service.ai_provider.generate", fake_generate)

    async with session_factory() as session:
        job = await placement_job_service.create_job(
            session,
            "question-generation",
            {"company": "Google", "role": "SDE", "topic": "Arrays", "difficulty": "medium", "question_type": "mcq"},
            idempotency_key="job-generation-valid",
        )
        claimed = await placement_job_service.claim_next_job(session, "worker-a")
        result = await placement_job_service.process_job(session, claimed)

        assert result.status == "completed"
        assert result.result["status"] == "approved"
        stored = await session.get(Question, result.result["question_id"])
        assert stored is not None
        assert stored.is_ai_generated is True
        assert stored.source_classification == "ai-generated"

    await engine.dispose()


@pytest.mark.asyncio
async def test_invalid_generation_output_is_not_published(monkeypatch):
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async def fake_generate(prompt: str):
        return json.dumps({
            "title": "Bad question",
            "description": "short",
            "difficulty": "easy",
            "question_type": "mcq",
            "company": "Google",
            "role": "SDE",
            "topic": "Arrays",
            "correct_option": "",
            "options": [
                {"key": "A", "text": "A"},
                {"key": "B", "text": "B"},
            ],
        })

    monkeypatch.setattr("app.modules.placement.job_service.ai_provider.generate", fake_generate)

    async with session_factory() as session:
        job = await placement_job_service.create_job(
            session,
            "question-generation",
            {"company": "Google", "role": "SDE", "topic": "Arrays", "difficulty": "easy", "question_type": "mcq"},
            idempotency_key="job-generation-invalid",
        )
        claimed = await placement_job_service.claim_next_job(session, "worker-a")
        with pytest.raises(ValueError):
            await placement_job_service.process_job(session, claimed)
        updated = await placement_job_service.mark_failure(session, claimed, ValueError("invalid generation"), retryable=True)
        assert updated.status == "queued"
        assert updated.retry_count == 1

        question_count = await session.execute(select(Question))
        assert len(question_count.scalars().all()) == 0

    await engine.dispose()


@pytest.mark.asyncio
async def test_inventory_shortage_enqueues_generation_jobs():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as session:
        target = PlacementInventoryTarget(
            company="Google",
            role="SDE",
            topic="Arrays",
            difficulty="medium",
            question_type="mcq",
            target_count=3,
        )
        session.add(target)
        await session.commit()

        valid_question = Question(
            title="Approved Google Arrays MCQ",
            slug="approved-google-arrays-mcq",
            description="Choose the correct option.",
            difficulty="medium",
            question_type="mcq",
            options=["A", "B"],
            correct_option="A",
            company="Google",
            role="SDE",
            topic="Arrays",
            subtopic="Indexing",
            is_active=True,
            is_validated=True,
            skill_category="Arrays",
        )
        session.add(valid_question)
        await session.commit()

        result = await placement_inventory_service.ensure_target_inventory(session, target)
        assert result["missing"] == 2
        assert result["enqueued"] == 2

        jobs = (await session.execute(select(PlacementJob))).scalars().all()
        assert len(jobs) == 2
        assert all(job.job_type == "question-generation" for job in jobs)

    await engine.dispose()


@pytest.mark.asyncio
async def test_coding_validation_uses_existing_judge_interface(monkeypatch):
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async def fake_generate(prompt: str):
        return json.dumps({
            "title": "Google Coding Sum",
            "description": "Print the sum of two integers.",
            "difficulty": "medium",
            "question_type": "coding",
            "company": "Google",
            "role": "SDE",
            "topic": "Arrays",
            "subtopic": "Basic Operations",
            "source_url": "https://example.test/google-sum",
            "source_classification": "ai-generated",
            "license": "AI-generated internal practice",
            "constraints": "1 <= n <= 100",
            "hidden_test_cases": [{"input": "1\n2\n", "output": "3\n"}],
            "solution": "a = int(input()); b = int(input()); print(a + b)",
            "skill_category": "Arrays",
            "explanation": "Add input values.",
            "is_ai_generated": True,
            "is_validated": False,
        })

    monkeypatch.setattr("app.modules.placement.job_service.ai_provider.generate", fake_generate)

    called = {"count": 0}

    def fake_judge(language: str, source_code: str, testcases: list[dict]):
        called["count"] += 1
        assert language == "python"
        assert "print(a + b)" in source_code
        assert testcases[0]["input"] == "1\n2\n"
        return SimpleNamespace(verdict="Accepted", passed_tests=1, total_tests=1)

    monkeypatch.setattr("app.modules.placement.job_service.judge_engine.judge", fake_judge)

    async with session_factory() as session:
        job = await placement_job_service.create_job(
            session,
            "question-generation",
            {"company": "Google", "role": "SDE", "topic": "Arrays", "difficulty": "medium", "question_type": "coding"},
            idempotency_key="job-generation-coding",
        )
        claimed = await placement_job_service.claim_next_job(session, "worker-a")
        result = await placement_job_service.process_job(session, claimed)
        assert result.status == "completed"
        assert called["count"] == 1

    await engine.dispose()
