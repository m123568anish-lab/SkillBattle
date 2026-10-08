"""
=========================================================

SkillBattle

Question Engine

Handles Question Bank resolution, AI Question Generation with strict validation,
and sanitization for client-side evaluation security.

=========================================================
"""

from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.question import Question
from app.models.problem import Problem
from app.models.question_exposure import QuestionExposure
from app.modules.ai.service import ai_service
from app.modules.battle.adaptive_selection import score_question

logger = logging.getLogger(__name__)


class QuestionEngine:

    @staticmethod
    def _normalize_question_type(question_type: str | None) -> str:
        return str(question_type or "").strip().lower()

    def validate_question_data(self, data: Dict[str, Any]) -> bool:
        """
        Validate question completeness and correctness before storing or using.
        Must contain required fields depending on question_type.
        """
        if not data.get("title") or len(str(data["title"]).strip()) < 3:
            return False
        if not data.get("description") or len(str(data["description"]).strip()) < 10:
            return False

        qtype = self._normalize_question_type(data.get("question_type", "coding"))

        if qtype in {"mcq", "aptitude"}:
            options = data.get("options")
            if not isinstance(options, list) or len(options) < 2:
                return False
            if not data.get("correct_option"):
                return False

        elif qtype == "debugging":
            if not data.get("buggy_code") or len(str(data["buggy_code"]).strip()) < 5:
                return False

        elif qtype in {"technical", "sql"}:
            if not data.get("rubric") and not data.get("explanation") and not data.get("expected_output") and not data.get("solution"):
                return False

        elif qtype == "coding":
            test_cases = data.get("hidden_test_cases") or data.get("examples") or []
            if not isinstance(test_cases, list) or len(test_cases) < 1:
                return False
            validcases = []
            for case in test_cases:
                if isinstance(case, dict) and (
                    ("input" in case and case.get("input") is not None)
                    or ("stdin" in case and case.get("stdin") is not None)
                ) and (
                    ("output" in case and case.get("output") is not None)
                    or ("stdout" in case and case.get("stdout") is not None)
                ):
                    validcases.append(case)
            if not validcases:
                return False

        return True

    def _is_adaptively_eligible(self, question: Any) -> bool:
        if question is None:
            return False
        if getattr(question, "is_active", True) is False:
            return False
        if getattr(question, "is_validated", False) is False:
            return False

        qtype = self._normalize_question_type(getattr(question, "question_type", "coding"))

        if qtype in {"mcq", "aptitude"}:
            options = getattr(question, "options", None) or []
            return bool(options) and bool(getattr(question, "correct_option", None))

        if qtype == "debugging":
            return bool((getattr(question, "buggy_code", None) or "").strip())

        if qtype == "technical":
            return bool((getattr(question, "rubric", None) or getattr(question, "explanation", None)))

        if qtype == "sql":
            description = (getattr(question, "description", None) or "").strip()
            expected = (getattr(question, "expected_output", None) or "").strip()
            solution = (getattr(question, "solution", None) or "").strip()
            return bool(description and (expected or solution))

        if qtype == "coding":
            test_cases = getattr(question, "hidden_test_cases", None) or getattr(question, "examples", None) or []
            if not isinstance(test_cases, list) or not test_cases:
                return False
            for case in test_cases:
                if not isinstance(case, dict):
                    return False
                has_input = case.get("input") is not None or case.get("stdin") is not None
                has_output = case.get("output") is not None or case.get("stdout") is not None
                if not has_input or not has_output:
                    return False
            return True

        return bool((getattr(question, "description", None) or "").strip())

    def get_default_assessment_sections(self, battle_type: str = "practice") -> List[Dict[str, Any]]:
        battle_type = (battle_type or "practice").strip().lower()
        defaults = {
            "practice": [
                {"title": "Knowledge Check", "question_type": "mcq", "question_count": 3, "weight": 0.3, "duration_minutes": 10, "negative_marking": False},
                {"title": "Coding Round", "question_type": "coding", "question_count": 1, "weight": 0.6, "duration_minutes": 20, "negative_marking": False},
                {"title": "Technical Review", "question_type": "technical", "question_count": 1, "weight": 0.1, "duration_minutes": 5, "negative_marking": False},
            ],
            "placement": [
                {"title": "Aptitude & Technical MCQs", "question_type": "mcq", "question_count": 5, "weight": 0.25, "duration_minutes": 15, "negative_marking": True},
                {"title": "DSA Coding Problems", "question_type": "coding", "question_count": 2, "weight": 0.50, "duration_minutes": 30, "negative_marking": False},
                {"title": "Debugging Challenge", "question_type": "debugging", "question_count": 1, "weight": 0.15, "duration_minutes": 10, "negative_marking": False},
                {"title": "Technical Concept Review", "question_type": "technical", "question_count": 1, "weight": 0.10, "duration_minutes": 5, "negative_marking": False},
            ],
        }
        return [dict(section) for section in defaults.get(battle_type, defaults["practice"])]

    async def _get_user_skill_evidence(
        self,
        db: AsyncSession,
        user_id: str,
        question_type: str,
        skill_category: str | None = None,
    ) -> Dict[str, Any]:
        stats = {"categories": {}, "types": {}}
        try:
            evidence_stmt = select(Question)
            evidence_result = await db.execute(evidence_stmt)
            rows = list(evidence_result.scalars().all())
            if not rows:
                return stats
            for row in rows:
                subject = getattr(row, "subject", None)
                category_name = None
                if subject is not None:
                    category_name = str(subject).strip()
                    total_attempts = getattr(row, "total_attempts", 0) or 0
                    correct_attempts = getattr(row, "correct_attempts", 0) or 0
                    if total_attempts:
                        stats["categories"][category_name.casefold()] = correct_attempts / total_attempts
                    else:
                        stats["categories"][category_name.casefold()] = 0.5
                elif getattr(row, "skill_category", None):
                    category_name = str(getattr(row, "skill_category", "")).strip()
                    if category_name:
                        stats["categories"][category_name.casefold()] = 0.5
            if question_type:
                stats["types"][question_type.casefold()] = 0.5
            if skill_category:
                stats["categories"][skill_category.casefold()] = 0.35
            return stats
        except Exception:
            return stats

    async def get_adaptive_questions_for_user(
        self,
        db: AsyncSession,
        user_id: str,
        sections_config: List[Dict[str, Any]],
        difficulty: str = "medium",
    ) -> List[Dict[str, Any]]:
        resolved_sections: List[Dict[str, Any]] = []
        for seq_index, section in enumerate(sections_config):
            qtype = self._normalize_question_type(section.get("question_type", "coding"))
            category = (section.get("skill_category") or "").strip()
            required = int(section.get("question_count", 1))
            title = section.get("title", f"Section {seq_index + 1}")

            filters = [Question.question_type == qtype, Question.is_active.is_(True), Question.is_validated.is_(True)]
            if category:
                filters.append(func.lower(Question.skill_category) == category.casefold())
            stmt = select(Question).where(*filters)
            result = await db.execute(stmt)
            candidate_rows = [row for row in result.scalars().all() if self._is_adaptively_eligible(row)]

            if len(candidate_rows) < required:
                raise ValueError(
                    f"Not enough validated {qtype} questions for section '{title}': required {required}, available {len(candidate_rows)}."
                )

            skill_evidence = await self._get_user_skill_evidence(db, user_id, qtype, category)
            seen_ids = set()
            chosen_rows = []
            selected_categories: Dict[str, int] = {}
            selected_types: Dict[str, int] = {}
            for row in candidate_rows:
                if row.id in seen_ids:
                    continue
                row_category = ((getattr(row, "skill_category", "") or "").strip() or qtype).casefold()
                category_accuracy = skill_evidence.get("categories", {}).get(row_category)
                type_accuracy = skill_evidence.get("types", {}).get(qtype.casefold())
                exposure_row = None
                try:
                    exposure_stmt = select(QuestionExposure).where(
                        QuestionExposure.user_id == user_id,
                        QuestionExposure.question_id == row.id,
                    )
                    exposure_result = await db.execute(exposure_stmt)
                    exposure_row = exposure_result.scalar_one_or_none()
                except Exception:
                    exposure_row = None

                exposure_count = getattr(exposure_row, "exposure_count", 0) if exposure_row else 0
                last_seen_at = getattr(exposure_row, "last_seen_at", None) if exposure_row else None
                last_question_correct = None
                if exposure_row is not None:
                    last_result = getattr(exposure_row, "last_result", None)
                    last_question_correct = last_result == "correct" if last_result else None

                score = score_question(
                    row,
                    skill_accuracy=category_accuracy,
                    type_accuracy=type_accuracy,
                    last_seen_at=last_seen_at,
                    exposure_count=exposure_count,
                    last_question_correct=last_question_correct,
                    requested_difficulty=difficulty,
                    now=datetime.utcnow(),
                    selected_categories=selected_categories,
                    selected_types=selected_types,
                )
                chosen_rows.append((score, row))

            chosen_rows.sort(key=lambda pair: pair[0], reverse=True)
            if len(chosen_rows) < required:
                raise ValueError(f"Not enough validated {qtype} questions: required {required}, available {len(chosen_rows)}")

            selected_rows = []
            for score, row in chosen_rows[:required]:
                seen_ids.add(row.id)
                selected_rows.append(row)
                selected_categories[(getattr(row, "skill_category", "") or "").strip().lower() or qtype] = selected_categories.get((getattr(row, "skill_category", "") or "").strip().lower() or qtype, 0) + 1
                selected_types[qtype] = selected_types.get(qtype, 0) + 1

            serialized = []
            for q in selected_rows:
                serialized.append({
                    "id": q.id,
                    "title": q.title,
                    "description": q.description,
                    "difficulty": q.difficulty,
                    "question_type": q.question_type,
                    "options": q.options or [],
                    "correct_option": q.correct_option,
                    "buggy_code": q.buggy_code or "",
                    "fixed_code_reference": q.fixed_code_reference or "",
                    "rubric": q.rubric or {},
                    "explanation": q.explanation or "",
                    "skill_category": q.skill_category or "Problem Solving",
                    "topic_tags": q.topic_tags or [],
                    "examples": q.examples or [],
                    "constraints": q.constraints or "",
                })

            resolved_sections.append({
                "section_index": seq_index,
                "title": title,
                "question_type": qtype,
                "skill_category": category or None,
                "weight": section.get("weight", 1.0),
                "duration_minutes": section.get("duration_minutes", 10),
                "negative_marking": section.get("negative_marking", False),
                "questions": serialized,
            })

        return resolved_sections

    async def generate_and_validate_ai_question(
        self,
        db: AsyncSession,
        question_type: str,
        difficulty: str = "medium",
        topic: str = "DSA",
    ) -> Question:
        """
        Uses AI Service to generate a structured question, validates it strictly,
        and persists it to the Question bank.
        """
        prompt = (
            f"Generate a structured {difficulty} {question_type.upper()} question for programming topic '{topic}'.\n"
            f"If MCQ: provide 4 distinct options with keys A, B, C, D and specify correct_option.\n"
            f"If Debugging: provide realistic buggy_code in Python with a subtle logic bug and fixed_code_reference.\n"
            f"If Technical: provide a conceptual question with evaluation rubric and key concepts.\n"
            f"If Coding: provide problem description, input_format, output_format, constraints, and test cases.\n"
            f"Return JSON format."
        )

        try:
            from app.modules.ai.provider import ai_provider
            raw_ai = await ai_provider.generate(prompt)
            parsed = {}
            if isinstance(raw_ai, dict):
                parsed = raw_ai
            elif isinstance(raw_ai, str):
                cleaned = raw_ai.strip()
                if cleaned.startswith("```json"):
                    cleaned = cleaned[7:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                parsed = json.loads(cleaned.strip())

            # Map fields to Question schema
            q_data = {
                "title": parsed.get("title", f"AI Generated {topic} {question_type.upper()}"),
                "slug": f"ai-{question_type}-{func.random()}",
                "description": parsed.get("description", parsed.get("problem_statement", f"Solve this {topic} challenge.")),
                "difficulty": difficulty,
                "question_type": question_type,
                "options": parsed.get("options", []),
                "correct_option": parsed.get("correct_option", parsed.get("answer", "A")),
                "buggy_code": parsed.get("buggy_code", ""),
                "fixed_code_reference": parsed.get("fixed_code_reference", ""),
                "rubric": parsed.get("rubric", {}),
                "explanation": parsed.get("explanation", ""),
                "topic_tags": [topic, question_type],
                "skill_category": topic,
                "is_ai_generated": True,
                "is_validated": False,
            }

            # Validate generated data
            is_valid = self.validate_question_data(q_data)
            q_data["is_validated"] = is_valid

            # Fallback if invalid
            if not is_valid:
                logger.warning(f"AI generated question failed validation. Using fallback question for {question_type}.")
                return await self._get_fallback_question(db, question_type, difficulty)

            question = Question(
                title=q_data["title"][:190],
                slug=f"ai-{question_type}-{func.random()}"[:210],
                description=q_data["description"],
                difficulty=difficulty,
                question_type=question_type,
                options=q_data["options"],
                correct_option=q_data["correct_option"],
                buggy_code=q_data["buggy_code"],
                fixed_code_reference=q_data["fixed_code_reference"],
                rubric=q_data["rubric"],
                explanation=q_data["explanation"],
                topic_tags=q_data["topic_tags"],
                skill_category=topic,
                is_ai_generated=True,
                is_validated=True,
            )
            db.add(question)
            await db.commit()
            await db.refresh(question)
            return question

        except Exception as err:
            logger.error(f"Failed to generate AI question: {err}", exc_info=True)
            return await self._get_fallback_question(db, question_type, difficulty)

    async def _get_fallback_question(
        self,
        db: AsyncSession,
        question_type: str,
        difficulty: str = "medium",
    ) -> Question:
        qtype = self._normalize_question_type(question_type)
        stmt = select(Question).where(
            Question.question_type == qtype,
            Question.is_active == True,
            Question.is_validated == True,
        ).limit(1)
        res = await db.execute(stmt)
        q = res.scalar_one_or_none()
        if q:
            return q

        if qtype == "coding":
            raise ValueError("No valid coding question available; a coding challenge requires executable test cases.")

        # Emergency synthetic question
        fallback = Question(
            title=f"Sample {qtype.upper()} Question",
            slug=f"sample-{qtype}-{func.random()}",
            description=f"Analyze the following {qtype} concept.",
            difficulty=difficulty,
            question_type=qtype,
            options=[
                {"key": "A", "text": "Option A (Correct)"},
                {"key": "B", "text": "Option B"},
                {"key": "C", "text": "Option C"},
                {"key": "D", "text": "Option D"},
            ],
            correct_option="A",
            buggy_code="def solution():\n    return False # Bug: should return True",
            fixed_code_reference="def solution():\n    return True",
            rubric={"concepts": ["Logic", "Syntax"]},
            explanation="Sample explanation.",
            topic_tags=["General"],
            skill_category="Problem Solving",
            is_ai_generated=False,
            is_validated=True,
        )
        db.add(fallback)
        await db.commit()
        await db.refresh(fallback)
        return fallback

    async def resolve_questions_for_sections(
        self,
        db: AsyncSession,
        sections_config: List[Dict[str, Any]],
        difficulty: str = "medium",
    ) -> List[Dict[str, Any]]:
        """
        Resolves a set of validated questions for each section in the battle configuration.
        Refuses to fabricate synthetic questions when inventory is insufficient.
        """
        resolved_sections = []

        for sec_idx, sec in enumerate(sections_config):
            qtype = str(sec.get("question_type", "coding")).lower()
            skill_category = (sec.get("skill_category") or "").strip()
            count = int(sec.get("question_count", 1))
            sec_title = sec.get("title", f"Section {sec_idx + 1}")

            filters = [
                Question.question_type == qtype,
                Question.is_active == True,
                Question.is_validated == True,
            ]
            if skill_category:
                filters.append(func.lower(Question.skill_category) == skill_category.casefold())
            stmt = select(Question).where(*filters)
            result = await db.execute(stmt)
            qs = [row for row in result.scalars().all() if self._is_adaptively_eligible(row)]

            if len(qs) < count:
                raise ValueError(
                    f"Not enough validated {qtype} questions for section '{sec_title}': required {count}, available {len(qs)}."
                )

            section_questions = []
            for q in qs[:count]:
                section_questions.append({
                    "id": q.id,
                    "title": q.title,
                    "description": q.description,
                    "difficulty": q.difficulty,
                    "question_type": q.question_type,
                    "options": q.options or [],
                    "correct_option": q.correct_option,
                    "buggy_code": q.buggy_code or "",
                    "fixed_code_reference": q.fixed_code_reference or "",
                    "rubric": q.rubric or {},
                    "explanation": q.explanation or "",
                    "skill_category": q.skill_category or "Problem Solving",
                    "topic_tags": q.topic_tags or [],
                    "examples": q.examples or [],
                    "constraints": q.constraints or "",
                })

            resolved_sections.append({
                "section_index": sec_idx,
                "title": sec_title,
                "question_type": qtype,
                "skill_category": skill_category or None,
                "weight": sec.get("weight", 1.0),
                "duration_minutes": sec.get("duration_minutes", 10),
                "negative_marking": sec.get("negative_marking", False),
                "questions": section_questions,
            })

        return resolved_sections

    def sanitize_sections_for_client(
        self,
        sections_data: List[Dict[str, Any]],
        current_section_index: int = 0,
        is_completed: bool = False,
    ) -> List[Dict[str, Any]]:
        """
        Strips correct options, hidden test cases, and reference solutions
        from question payloads sent to the student client while battle is running.
        """
        sanitized = []
        for sec in sections_data:
            sec_idx = sec.get("section_index", 0)
            clean_qs = []
            for q in sec.get("questions", []):
                q_copy = dict(q)
                if not is_completed:
                    q_copy.pop("correct_option", None)
                    q_copy.pop("fixed_code_reference", None)
                    q_copy.pop("hidden_test_cases", None)
                    q_copy.pop("expected_output", None)
                    q_copy.pop("solution", None)
                    q_copy.pop("rubric", None)
                    q_copy.pop("explanation", None)
                clean_qs.append(q_copy)

            sanitized.append({
                "section_index": sec_idx,
                "title": sec.get("title"),
                "question_type": sec.get("question_type"),
                "skill_category": sec.get("skill_category"),
                "weight": sec.get("weight"),
                "duration_minutes": sec.get("duration_minutes"),
                "negative_marking": sec.get("negative_marking"),
                "questions": clean_qs,
            })
        return sanitized


question_engine = QuestionEngine()
