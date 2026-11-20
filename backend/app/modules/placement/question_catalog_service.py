from __future__ import annotations

import hashlib
import re
from datetime import datetime
from typing import Any, Iterable

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.question import Question

QUESTION_LIFECYCLE_STATES = {
    "DISCOVERED",
    "DRAFT",
    "VALIDATING",
    "APPROVED",
    "PUBLISHED",
    "REJECTED",
    "DUPLICATE",
    "NEEDS_REVIEW",
}

QUESTION_SOURCE_CLASSIFICATIONS = {
    "official-public-material",
    "licensed-public-dataset",
    "community-reported",
    "ai-generated",
    "existing-inventory",
}

VALID_QUESTION_TYPES = {
    "mcq",
    "coding",
    "sql",
    "debugging",
    "technical",
    "aptitude",
    "logical_reasoning",
    "verbal_ability",
    "output_prediction",
    "core_cs",
}


class PlacementQuestionCatalogService:
    @staticmethod
    def _normalize_text(value: Any) -> str:
        return re.sub(r"\s+", " ", str(value or "")).strip().lower()

    @classmethod
    def _canonical_hash(cls, data: dict[str, Any]) -> str:
        fingerprint = "|".join(
            [
                str(data.get("company") or ""),
                str(data.get("role") or ""),
                str(data.get("topic") or ""),
                str(data.get("subtopic") or ""),
                str(data.get("question_type") or data.get("question_kind") or ""),
                str(data.get("title") or ""),
                str(data.get("description") or ""),
                "|".join(str(item or "") for item in data.get("options") or []),
            ]
        )
        return hashlib.sha256(fingerprint.encode("utf-8")).hexdigest()

    @classmethod
    def validate_question_data(cls, data: dict[str, Any]) -> dict[str, Any]:
        errors: list[str] = []
        qtype = str(data.get("question_type") or data.get("question_kind") or "mcq").strip().lower()
        title = str(data.get("title") or "").strip()
        description = str(data.get("description") or "").strip()
        company = str(data.get("company") or "").strip()
        topic = str(data.get("topic") or "").strip()

        if not title:
            errors.append("Missing question title.")
        if len(title) < 5:
            errors.append("Question title is too short.")
        if len(description) < 10:
            errors.append("Question description is too short.")
        if not company:
            errors.append("Question must include company metadata.")
        if not topic:
            errors.append("Question must include topic metadata.")
        if qtype not in VALID_QUESTION_TYPES:
            errors.append(f"Unsupported question type '{qtype}'.")

        if qtype in {"mcq", "aptitude", "logical_reasoning", "verbal_ability", "output_prediction", "core_cs"}:
            options = data.get("options") or []
            if not isinstance(options, list) or len(options) < 2:
                errors.append("MCQ-style questions require at least two options.")
            correct = str(data.get("correct_option") or "").strip()
            if not correct:
                errors.append("MCQ-style questions require a correct_option value.")

        if qtype == "coding":
            if not data.get("hidden_test_cases"):
                errors.append("Coding questions require executable hidden_test_cases.")
            if not data.get("constraints"):
                errors.append("Coding questions require constraints.")

        if qtype == "debugging":
            if not data.get("buggy_code"):
                errors.append("Debugging questions require buggy_code.")
            if not data.get("fixed_code_reference"):
                errors.append("Debugging questions require fixed_code_reference.")

        if qtype in {"technical", "sql"}:
            if not (data.get("rubric") or data.get("explanation") or data.get("expected_output") or data.get("solution")):
                errors.append("Technical and SQL questions need a validation artifact.")

        return {"valid": not errors, "reasons": errors}

    @classmethod
    def _map_question_type(cls, value: Any) -> str:
        qtype = str(value or "mcq").strip().lower()
        mapping = {
            "multiple_choice": "mcq",
            "mcq": "mcq",
            "coding_challenge": "coding",
            "code": "coding",
            "sql_query": "sql",
            "dsa": "coding",
            "aptitude_question": "aptitude",
            "logical_reasoning_question": "logical_reasoning",
            "verbal_question": "verbal_ability",
            "output_prediction_question": "output_prediction",
            "core_cs_question": "core_cs",
            "technical_question": "technical",
            "debugging_question": "debugging",
        }
        return mapping.get(qtype, qtype)

    @staticmethod
    def _option_text_values(options: Iterable[Any]) -> list[str]:
        extracted: list[str] = []
        for option in options or []:
            if isinstance(option, dict):
                extracted.append(str(option.get("text") or option.get("value") or option.get("option") or str(option)))
            else:
                extracted.append(str(option))
        return extracted

    @classmethod
    def _duplicate_candidate_text(cls, data: dict[str, Any]) -> str:
        values = [
            data.get("description") or "",
            data.get("company") or "",
            data.get("topic") or "",
            data.get("subtopic") or "",
            *cls._option_text_values(data.get("options") or []),
        ]
        return cls._normalize_text(" ".join(str(item) for item in values))

    @classmethod
    async def find_duplicate_question(cls, db: AsyncSession, data: dict[str, Any]) -> Question | None:
        canonical_hash = cls._canonical_hash(data)
        exact = await db.execute(select(Question).where(Question.canonical_hash == canonical_hash))
        exact_row = exact.scalar_one_or_none()
        if exact_row is not None:
            return exact_row

        candidate_text = cls._duplicate_candidate_text(data)
        rows = await db.execute(select(Question).limit(500))
        for row in rows.scalars().all():
            if not row.description:
                continue
            existing_text = cls._normalize_text(
                f"{row.description} {row.company} {row.topic} {row.subtopic} {' '.join(cls._option_text_values(row.options or []))}"
            )
            if candidate_text and existing_text and candidate_text == existing_text:
                return row
            if row.company and row.topic and row.company.lower() == str(data.get("company") or "").lower() and row.topic.lower() == str(data.get("topic") or "").lower():
                if cls._normalize_text(row.title) == cls._normalize_text(data.get("title") or ""):
                    return row
        return None

    @classmethod
    async def list_inventory(
        cls,
        db: AsyncSession,
        *,
        company: str | None = None,
        role: str | None = None,
        topic: str | None = None,
        difficulty: str | None = None,
        question_type: str | None = None,
        source_classification: str | None = None,
        verification_status: str | None = None,
    ) -> list[dict[str, Any]]:
        stmt = select(Question).where(Question.is_active.is_(True))
        if company:
            stmt = stmt.where(Question.company.ilike(f"%{company}%"))
        if role:
            stmt = stmt.where(Question.role.ilike(f"%{role}%"))
        if topic:
            stmt = stmt.where(Question.topic.ilike(f"%{topic}%"))
        if difficulty:
            stmt = stmt.where(Question.difficulty.ilike(f"%{difficulty}%"))
        if question_type:
            stmt = stmt.where(Question.question_type.ilike(f"%{question_type}%"))
        if source_classification:
            stmt = stmt.where(Question.source_classification == source_classification)
        if verification_status:
            stmt = stmt.where(Question.verification_status == verification_status)
        stmt = stmt.order_by(Question.id.desc())
        result = await db.execute(stmt)
        rows = result.scalars().all()
        return [cls.serialize_question(row) for row in rows]

    @staticmethod
    def serialize_question(question: Question) -> dict[str, Any]:
        return {
            "id": question.id,
            "title": question.title,
            "description": question.description,
            "difficulty": question.difficulty,
            "question_type": question.question_type,
            "question_kind": question.question_kind,
            "company": question.company,
            "role": question.role,
            "topic": question.topic,
            "subtopic": question.subtopic,
            "assessment_round": question.assessment_round,
            "source_url": question.source_url,
            "source_classification": question.source_classification,
            "license": question.license,
            "verification_status": question.verification_status,
            "approval_status": question.approval_status,
            "lifecycle_state": question.lifecycle_state,
            "options": question.options or [],
            "correct_option": question.correct_option,
            "buggy_code": question.buggy_code or "",
            "fixed_code_reference": question.fixed_code_reference or "",
            "explanation": question.explanation or "",
            "skill_category": question.skill_category or "",
            "topic_tags": question.topic_tags or [],
            "is_ai_generated": question.is_ai_generated,
            "is_validated": question.is_validated,
            "is_active": question.is_active,
            "duplicate_of_id": question.duplicate_of_id,
            "failure_reasons": question.failure_reasons or [],
            "canonical_hash": question.canonical_hash,
            "original_publish_date": question.original_publish_date,
            "license": question.license,
        }

    @classmethod
    async def persist_question(cls, db: AsyncSession, data: dict[str, Any]) -> Question:
        normalized_type = cls._map_question_type(data.get("question_type") or data.get("question_kind") or "mcq")
        title = str(data.get("title") or "").strip()
        slug = str(data.get("slug") or f"placement-{normalized_type}-{hashlib.sha256(title.encode()).hexdigest()[:12]}")
        payload = {
            "title": title,
            "slug": slug,
            "description": str(data.get("description") or "").strip(),
            "difficulty": str(data.get("difficulty") or "medium").strip().lower(),
            "question_type": normalized_type,
            "options": data.get("options") or [],
            "correct_option": str(data.get("correct_option") or "").strip(),
            "buggy_code": str(data.get("buggy_code") or "").strip(),
            "fixed_code_reference": str(data.get("fixed_code_reference") or "").strip(),
            "rubric": data.get("rubric") or {},
            "explanation": str(data.get("explanation") or "").strip(),
            "constraints": str(data.get("constraints") or "").strip(),
            "examples": data.get("examples") or [],
            "hidden_test_cases": data.get("hidden_test_cases") or [],
            "company_tags": [str(item) for item in (data.get("company_tags") or [])],
            "topic_tags": [str(item) for item in (data.get("topic_tags") or [])],
            "skill_category": str(data.get("skill_category") or data.get("topic") or "Problem Solving").strip(),
            "estimated_time_minutes": int(data.get("estimated_time_minutes") or 10),
            "source_url": str(data.get("source_url") or "").strip(),
            "source_classification": str(data.get("source_classification") or "existing-inventory").strip(),
            "company": str(data.get("company") or "").strip(),
            "role": str(data.get("role") or "").strip(),
            "assessment_round": str(data.get("assessment_round") or "").strip(),
            "question_kind": normalized_type,
            "topic": str(data.get("topic") or "").strip(),
            "subtopic": str(data.get("subtopic") or "").strip(),
            "original_publish_date": str(data.get("original_publish_date") or "").strip() or None,
            "license": str(data.get("license") or "").strip(),
            "verification_status": str(data.get("verification_status") or "approved").strip(),
            "approval_status": str(data.get("approval_status") or "approved").strip(),
            "lifecycle_state": str(data.get("lifecycle_state") or "PUBLISHED").strip().upper(),
            "reuse_permission": str(data.get("reuse_permission") or data.get("license") or "").strip(),
            "is_ai_generated": bool(data.get("is_ai_generated")),
            "is_validated": bool(data.get("is_validated")),
            "is_active": bool(data.get("is_active", True)),
            "duplicate_of_id": data.get("duplicate_of_id"),
            "failure_reasons": data.get("failure_reasons") or [],
            "canonical_hash": cls._canonical_hash(data),
        }

        question = Question(**payload)
        db.add(question)
        await db.commit()
        await db.refresh(question)
        return question

    @classmethod
    async def ingest_question(cls, db: AsyncSession, data: dict[str, Any]) -> dict[str, Any]:
        normalized = dict(data)
        normalized["question_type"] = cls._map_question_type(normalized.get("question_type") or normalized.get("question_kind") or "mcq")
        normalized["question_kind"] = normalized["question_type"]
        validation = cls.validate_question_data(normalized)
        if normalized.get("company") is None:
            normalized["company"] = "General"
        duplicate = await cls.find_duplicate_question(db, normalized)
        if duplicate is not None:
            normalized["approval_status"] = "duplicate"
            normalized["verification_status"] = "duplicate"
            normalized["lifecycle_state"] = "DUPLICATE"
            normalized["duplicate_of_id"] = duplicate.id
            normalized["is_validated"] = False
            normalized["is_active"] = False
            normalized["failure_reasons"] = ["Duplicate of existing question ID {0}".format(duplicate.id)]
            persisted = await cls.persist_question(db, normalized)
            return {
                "question": persisted,
                "status": "duplicate",
                "duplicate_of_id": duplicate.id,
                "validation": validation,
            }

        if not validation["valid"]:
            normalized["approval_status"] = "needs_review"
            normalized["verification_status"] = "needs_review"
            normalized["lifecycle_state"] = "NEEDS_REVIEW"
            normalized["is_validated"] = False
            normalized["is_active"] = False
            normalized["failure_reasons"] = validation["reasons"]
            persisted = await cls.persist_question(db, normalized)
            return {"question": persisted, "status": "needs_review", "validation": validation}

        normalized["approval_status"] = "approved"
        normalized["verification_status"] = "approved"
        normalized["lifecycle_state"] = "PUBLISHED"
        normalized["is_validated"] = True
        normalized["is_active"] = True
        normalized["failure_reasons"] = []
        persisted = await cls.persist_question(db, normalized)
        return {"question": persisted, "status": "approved", "validation": validation}

    @classmethod
    async def trigger_question_validation(cls, db: AsyncSession, question_id: int) -> dict[str, Any]:
        question = await db.get(Question, question_id)
        if question is None:
            raise ValueError(f"Question {question_id} not found.")

        validation = cls.validate_question_data(
            {
                "title": question.title,
                "description": question.description,
                "question_type": question.question_type,
                "company": question.company,
                "topic": question.topic,
                "options": question.options,
                "correct_option": question.correct_option,
                "buggy_code": question.buggy_code,
                "fixed_code_reference": question.fixed_code_reference,
                "rubric": question.rubric,
                "explanation": question.explanation,
                "hidden_test_cases": question.hidden_test_cases,
                "constraints": question.constraints,
            }
        )
        question.lifecycle_state = "VALIDATING"
        question.failure_reasons = validation["reasons"] if not validation["valid"] else []
        question.verification_status = "approved" if validation["valid"] else "needs_review"
        question.approval_status = "approved" if validation["valid"] else "needs_review"
        question.is_validated = validation["valid"]
        question.is_active = validation["valid"]
        if validation["valid"]:
            question.lifecycle_state = "APPROVED"
        await db.commit()
        await db.refresh(question)
        return {"question": question, "status": question.approval_status, "validation": validation}

    @classmethod
    async def create_seed_question(cls, db: AsyncSession, company: str, role: str, topic: str, question_type: str = "mcq") -> Question:
        question_type = cls._map_question_type(question_type)
        payload = {
            "title": f"{company} {role} {topic} {question_type.upper()} sample",
            "description": f"Practice a {company} {role} {topic} question with a focused {question_type} scenario.",
            "difficulty": "medium",
            "question_type": question_type,
            "options": [
                {"key": "A", "text": "Option A"},
                {"key": "B", "text": "Option B"},
                {"key": "C", "text": "Option C"},
                {"key": "D", "text": "Option D"},
            ],
            "correct_option": "A",
            "company": company,
            "role": role,
            "topic": topic,
            "subtopic": topic,
            "source_url": "https://placeholder.example/company-prep",
            "source_classification": "official-public-material",
            "license": "Public reference material",
            "verification_status": "approved",
            "approval_status": "approved",
            "lifecycle_state": "PUBLISHED",
            "is_ai_generated": False,
            "is_validated": True,
            "is_active": True,
        }
        return (await cls.ingest_question(db, payload))["question"]


placement_question_catalog_service = PlacementQuestionCatalogService()
