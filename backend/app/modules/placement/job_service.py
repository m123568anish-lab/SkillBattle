from __future__ import annotations

import hashlib
import json
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.placement_jobs import PlacementJob
from app.models.question import Question
from app.modules.ai.provider import ai_provider
from app.modules.compiler.judge import judge_engine
from app.modules.placement.question_catalog_service import placement_question_catalog_service
from app.modules.placement.source_connector import public_source_connector


class PlacementJobService:
    @staticmethod
    def make_idempotency_key(job_type: str, payload: dict[str, Any]) -> str:
        payload_bytes = json.dumps(payload or {}, sort_keys=True).encode("utf-8")
        return f"{job_type}:{hashlib.sha256(payload_bytes).hexdigest()}"

    @staticmethod
    async def create_job(
        db: AsyncSession,
        job_type: str,
        payload: dict[str, Any],
        *,
        idempotency_key: str | None = None,
        max_retries: int = 3,
    ) -> PlacementJob:
        effective_key = idempotency_key or PlacementJobService.make_idempotency_key(job_type, payload)
        existing = (
            await db.execute(select(PlacementJob).where(PlacementJob.idempotency_key == effective_key))
        ).scalar_one_or_none()
        if existing is not None:
            return existing

        job = PlacementJob(
            job_type=job_type,
            status="queued",
            idempotency_key=effective_key,
            payload=payload or {},
            max_retries=max_retries,
            retry_count=0,
            error_details="",
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)
        return job

    @staticmethod
    async def claim_next_job(db: AsyncSession, worker_name: str, *, lock_seconds: int = 60) -> PlacementJob | None:
        now = datetime.utcnow()

        expired_running = (
            select(PlacementJob)
            .where(PlacementJob.status == "running")
            .where(PlacementJob.lock_expires_at.is_not(None))
            .where(PlacementJob.lock_expires_at <= now)
            .where(PlacementJob.retry_count < PlacementJob.max_retries)
            .order_by(PlacementJob.started_at.asc())
            .limit(1)
            .with_for_update(skip_locked=True)
        )
        result = await db.execute(expired_running)
        job = result.scalar_one_or_none()
        if job is None:
            stmt = (
                select(PlacementJob)
                .where(PlacementJob.status == "queued")
                .where(PlacementJob.retry_count < PlacementJob.max_retries)
                .order_by(PlacementJob.created_at.asc())
                .limit(1)
                .with_for_update(skip_locked=True)
            )
            result = await db.execute(stmt)
            job = result.scalar_one_or_none()

        if job is None:
            return None
        if job.status == "running" and job.lock_expires_at and job.lock_expires_at > now:
            return None
        job.status = "running"
        job.worker_name = worker_name
        job.worker_lock_token = f"{worker_name}:{now.isoformat()}"
        job.lock_expires_at = now + timedelta(seconds=lock_seconds)
        job.started_at = now
        job.updated_at = now
        job.error_details = ""
        await db.commit()
        await db.refresh(job)
        return job

    @staticmethod
    async def mark_success(db: AsyncSession, job: PlacementJob, result: dict[str, Any] | None = None) -> PlacementJob:
        job.status = "completed"
        job.result = result or {}
        job.error_details = ""
        job.completed_at = datetime.utcnow()
        job.updated_at = datetime.utcnow()
        job.lock_expires_at = None
        job.worker_lock_token = ""
        await db.commit()
        await db.refresh(job)
        return job

    @staticmethod
    async def mark_failure(db: AsyncSession, job: PlacementJob, error: Exception | str, *, retryable: bool = True) -> PlacementJob:
        message = str(error)
        job.error_details = message
        if job.retry_count < job.max_retries and retryable:
            job.retry_count += 1
            job.status = "queued"
            job.worker_name = ""
            job.worker_lock_token = ""
            job.lock_expires_at = None
            job.updated_at = datetime.utcnow()
        else:
            job.status = "failed"
            job.completed_at = datetime.utcnow()
            job.updated_at = datetime.utcnow()
            job.lock_expires_at = None
            job.worker_lock_token = ""
        await db.commit()
        await db.refresh(job)
        return job

    @staticmethod
    async def retry_job(db: AsyncSession, job_id: int) -> PlacementJob:
        job = await db.get(PlacementJob, job_id)
        if job is None:
            raise ValueError(f"Job {job_id} not found.")
        if job.status not in {"failed", "queued"}:
            raise ValueError(f"Job {job_id} cannot be retried from status '{job.status}'.")
        if job.retry_count >= job.max_retries:
            job.max_retries = job.retry_count + 2
        job.retry_count += 1
        job.status = "queued"
        job.error_details = ""
        job.worker_name = ""
        job.worker_lock_token = ""
        job.lock_expires_at = None
        job.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(job)
        return job

    @staticmethod
    async def get_job(db: AsyncSession, job_id: int) -> PlacementJob | None:
        return await db.get(PlacementJob, job_id)

    @staticmethod
    async def process_job(db: AsyncSession, job: PlacementJob) -> PlacementJob:
        payload = job.payload or {}
        if job.job_type == "public-source-discovery":
            source = await public_source_connector.fetch_and_record(
                db,
                payload["source_url"],
                company=payload.get("company", ""),
                role=payload.get("role", ""),
                source_classification=payload.get("source_classification", "official-public-material"),
                license=payload.get("license", "public reference resource"),
            )
            job.result = {"source_id": source.id, "source_url": source.source_url, "topics": source.extracted_topics}
            return await PlacementJobService.mark_success(db, job, job.result)

        if job.job_type == "question-generation":
            prompt = (
                f"Generate a valid placement question for company={payload.get('company','')} "
                f"role={payload.get('role','')} topic={payload.get('topic','')} "
                f"difficulty={payload.get('difficulty','medium')} question_type={payload.get('question_type','mcq')}. "
                "Return strict JSON with keys: title, description, difficulty, question_type, company, role, topic, subtopic, "
                "source_url, source_classification, license, options, correct_option, hidden_test_cases, constraints, explanation, "
                "skill_category, is_ai_generated, is_validated."
            )
            response = await ai_provider.generate(prompt)
            if isinstance(response, str):
                try:
                    parsed = json.loads(response)
                except json.JSONDecodeError:
                    text = response.strip()
                    if text.startswith("```json"):
                        text = text[7:]
                    if text.endswith("```"):
                        text = text[:-3]
                    parsed = json.loads(text)
            else:
                parsed = response
            if not isinstance(parsed, dict):
                raise ValueError("LLM response was not a JSON object.")
            normalized = {
                "title": parsed.get("title") or f"{payload.get('company','Company')} {payload.get('topic','Topic')} {payload.get('question_type','mcq').upper()}",
                "description": parsed.get("description") or parsed.get("problem_statement") or "Practice this question.",
                "difficulty": (parsed.get("difficulty") or payload.get("difficulty") or "medium").lower(),
                "question_type": parsed.get("question_type") or payload.get("question_type") or "mcq",
                "company": parsed.get("company") or payload.get("company") or "General",
                "role": parsed.get("role") or payload.get("role") or "General",
                "topic": parsed.get("topic") or payload.get("topic") or "General",
                "subtopic": parsed.get("subtopic") or payload.get("topic") or payload.get("topic") or "General",
                "source_url": parsed.get("source_url") or f"https://internal.example/questions/{payload.get('company','company')}/{payload.get('topic','topic')}",
                "source_classification": parsed.get("source_classification") or "ai-generated",
                "license": parsed.get("license") or "AI-generated internal practice",
                "options": parsed.get("options") or [{"key": "A", "text": "Option A"}, {"key": "B", "text": "Option B"}],
                "correct_option": parsed.get("correct_option") or "A",
                "hidden_test_cases": parsed.get("hidden_test_cases") or [{"input": "1", "output": "1"}],
                "constraints": parsed.get("constraints") or "N/A",
                "explanation": parsed.get("explanation") or "Practice question.",
                "solution": parsed.get("solution") or parsed.get("reference_solution") or "",
                "skill_category": parsed.get("skill_category") or payload.get("topic") or "Problem Solving",
                "is_ai_generated": True,
                "is_validated": False,
                "is_active": True,
            }
            validation = placement_question_catalog_service.validate_question_data(normalized)
            if not validation["valid"]:
                raise ValueError("; ".join(validation["reasons"]))

            if normalized["question_type"] == "coding":
                engine_payload = normalized.get("hidden_test_cases") or []
                solution = normalized.get("solution")
                if isinstance(engine_payload, list) and engine_payload and solution:
                    judge_result = judge_engine.judge(
                        "python",
                        solution,
                        engine_payload,
                    )
                    if judge_result.verdict.lower() != "accepted":
                        raise ValueError(f"Coding validation failed: {judge_result.verdict}")

            saved = await placement_question_catalog_service.ingest_question(db, normalized)
            job.result = {
                "status": saved["status"],
                "question_id": saved["question"].id,
                "validation": saved.get("validation", {}),
            }
            if saved["status"] in {"duplicate", "needs_review"}:
                return await PlacementJobService.mark_success(db, job, job.result)
            return await PlacementJobService.mark_success(db, job, job.result)

        if job.job_type == "inventory-reconciliation":
            job.result = {"status": "inventory reconciliation complete"}
            return await PlacementJobService.mark_success(db, job, job.result)

        if job.job_type == "question-validation":
            question_id = int(payload.get("question_id", 0))
            if question_id <= 0:
                raise ValueError("question_id required for validation job")
            question = await db.get(Question, question_id)
            if question is None:
                raise ValueError(f"Question {question_id} not found.")
            validation = placement_question_catalog_service.validate_question_data({
                "title": question.title,
                "description": question.description,
                "question_type": question.question_type,
                "company": question.company,
                "topic": question.topic,
                "options": question.options,
                "correct_option": question.correct_option,
                "hidden_test_cases": question.hidden_test_cases,
                "constraints": question.constraints,
            })
            job.result = {"question_id": question_id, "validation": validation}
            return await PlacementJobService.mark_success(db, job, job.result)

        raise ValueError(f"Unsupported job type: {job.job_type}")


placement_job_service = PlacementJobService()
