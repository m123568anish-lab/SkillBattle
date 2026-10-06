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
import re
from collections import defaultdict
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.question import Question, UserSubmission
from app.models.question_exposure import QuestionExposure
from app.models.user_skill_stat import UserSkillStat
from app.models.battle import BattleSubmission
from app.models.problem import Problem
from app.modules.ai.service import ai_service
from app.modules.battle.adaptive_selection import (
    DEFAULT_SELECTION_POLICY,
    score_question,
)

logger = logging.getLogger(__name__)


class QuestionValidationService:
    """Canonical validation rules for all question types used across battle, practice, and placement flows."""

    QUESTION_TYPE_ALIASES = {
        "multiple_choice": "mcq",
        "mcq": "mcq",
        "multiple-choice": "mcq",
        "coding": "coding",
        "debugging": "debugging",
        "technical": "technical",
        "sql": "sql",
        "sql_query": "sql",
        "aptitude": "aptitude",
        "quantitative": "aptitude",
        "logical": "aptitude",
    }

    @staticmethod
    def normalize_question_type(question_type: Any) -> str:
        value = str(question_type or "").strip().lower().replace(" ", "_")
        return QuestionValidationService.QUESTION_TYPE_ALIASES.get(value, value)

    @staticmethod
    def _json_list(value: Any) -> list[Any]:
        if isinstance(value, list):
            return value
        if isinstance(value, tuple):
            return list(value)
        return []

    @staticmethod
    def _normalize_text(value: Any) -> str:
        return " ".join(str(value or "").strip().split())

    @staticmethod
    def _token_set(value: Any) -> set[str]:
        normalized = QuestionValidationService._normalize_text(value).lower()
        return set(re.findall(r"\w+", normalized)) if normalized else set()

    @classmethod
    def validate_question_data(cls, data: Dict[str, Any] | Any) -> bool:
        if not hasattr(data, "__dict__") and not isinstance(data, dict):
            return False
        payload = data.__dict__ if hasattr(data, "__dict__") else dict(data)

        title = cls._normalize_text(payload.get("title"))
        description = cls._normalize_text(payload.get("description"))
        if len(title) < 3 or len(description) < 10:
            return False

        qtype = cls.normalize_question_type(payload.get("question_type"))
        if not qtype:
            return False

        if qtype == "mcq":
            options = cls._json_list(payload.get("options"))
            return len(options) >= 2 and bool(payload.get("correct_option"))

        if qtype == "coding":
            test_cases = cls._json_list(payload.get("hidden_test_cases")) or cls._json_list(payload.get("examples"))
            return any(
                isinstance(case, dict) and "input" in case and "output" in case
                for case in test_cases
            )

        if qtype == "debugging":
            buggy_code = payload.get("buggy_code")
            fixed_reference = payload.get("fixed_code_reference")
            return bool(buggy_code and str(buggy_code).strip() and fixed_reference is not None)

        if qtype == "technical":
            rubric = payload.get("rubric") or {}
            explanation = payload.get("explanation") or ""
            return bool(rubric) or len(cls._normalize_text(explanation)) >= 10

        if qtype == "sql":
            expected_output = payload.get("expected_output") or payload.get("expected_query") or payload.get("schema")
            return bool(expected_output) or bool(payload.get("database_schema"))

        if qtype == "aptitude":
            options = cls._json_list(payload.get("options"))
            if len(options) < 2:
                return False
            if isinstance(payload.get("correct_option"), (int, str)):
                return bool(payload.get("correct_option"))
            return bool(payload.get("answer"))

        return False

    @staticmethod
    def find_duplicate_question(data: Dict[str, Any], existing_candidates: List[Dict[str, Any]]) -> bool:
        if not existing_candidates:
            return False
        payload = dict(data)
        title_tokens = QuestionValidationService._token_set(payload.get("title"))
        description_tokens = QuestionValidationService._token_set(payload.get("description"))
        if not title_tokens and not description_tokens:
            return False

        for candidate in existing_candidates:
            candidate_tokens = QuestionValidationService._token_set(candidate.get("title")) | QuestionValidationService._token_set(candidate.get("description"))
            if not candidate_tokens:
                continue
            overlap = len(title_tokens.intersection(candidate_tokens)) + len(description_tokens.intersection(candidate_tokens))
            if overlap == 0:
                continue
            jaccard = overlap / max(1, len(title_tokens | description_tokens | candidate_tokens))
            if jaccard >= 0.55:
                return True
        return False


class QuestionEngine:
    @staticmethod
    def _is_adaptively_eligible(question: Question) -> bool:
        if not question.title or not question.description or not question.is_active or not question.is_validated:
            return False
        question_type = (question.question_type or "").casefold()
        if question_type in {"mcq", "aptitude"}:
            return isinstance(question.options, list) and len(question.options) >= 2 and bool(question.correct_option)
        if question_type == "coding":
            cases = question.hidden_test_cases or question.examples or []
            return any(
                isinstance(case, dict) and "input" in case and "output" in case
                for case in cases
            )
        if question_type == "debugging":
            return bool(question.buggy_code and question.fixed_code_reference)
        if question_type == "technical":
            return bool(question.rubric or question.explanation)
        return False

    async def get_adaptive_questions_for_user(
        self,
        db: AsyncSession,
        user_id: str,
        sections_config: List[Dict[str, Any]],
        difficulty: str = "medium",
    ) -> List[Dict[str, Any]]:
        """Select a diverse, evidence-ranked battle using persisted student outcomes."""
        requested_types = {
            str(section.get("question_type", "coding")).casefold()
            for section in sections_config
        }
        candidates_by_type: dict[str, list[Question]] = {}
        for question_type in requested_types:
            result = await db.execute(
                select(Question)
                .where(
                    Question.question_type == question_type,
                    Question.is_active.is_(True),
                    Question.is_validated.is_(True),
                )
                .order_by(Question.id)
                .limit(DEFAULT_SELECTION_POLICY.candidate_limit)
            )
            candidates_by_type[question_type] = [
                question
                for question in result.scalars().all()
                if self._is_adaptively_eligible(question)
            ]

        all_candidates = [
            question
            for candidates in candidates_by_type.values()
            for question in candidates
        ]
        question_ids = {question.id for question in all_candidates}
        if not question_ids:
            raise ValueError("No validated questions are currently available for an adaptive battle.")

        skill_stats_result = await db.execute(
            select(UserSkillStat).where(UserSkillStat.user_id == user_id)
        )
        lifetime_accuracy = {
            stat.subject.strip().casefold(): stat.correct_attempts / stat.total_attempts
            for stat in skill_stats_result.scalars().all()
            if stat.total_attempts > 0
        }

        recent_result = await db.execute(
            select(
                BattleSubmission.question_id,
                BattleSubmission.verdict,
                BattleSubmission.submitted_at,
                Question.skill_category,
                Question.question_type,
            )
            .join(Question, Question.id == BattleSubmission.question_id)
            .where(
                BattleSubmission.user_id == user_id,
                BattleSubmission.question_id.is_not(None),
            )
            .order_by(BattleSubmission.submitted_at.desc())
            .limit(DEFAULT_SELECTION_POLICY.recent_submission_limit)
        )
        recent_submissions = list(recent_result.all())
        user_submissions_result = await db.execute(
            select(
                UserSubmission.question_id,
                UserSubmission.solved,
                UserSubmission.created_at,
                Question.skill_category,
            )
            .join(Question, Question.id == UserSubmission.question_id)
            .where(UserSubmission.user_id == user_id)
            .order_by(UserSubmission.created_at.desc())
            .limit(DEFAULT_SELECTION_POLICY.recent_submission_limit)
        )
        recent_submissions.extend(
            (
                question_id,
                "Accepted" if solved else "Wrong Answer",
                submitted_at,
                category,
                "coding",
            )
            for question_id, solved, submitted_at, category in user_submissions_result.all()
        )
        recent_submissions.sort(key=lambda item: item[2], reverse=True)
        recent_submissions = recent_submissions[:DEFAULT_SELECTION_POLICY.recent_submission_limit]
        recent_skill_results: dict[str, list[bool]] = defaultdict(list)
        recent_type_results: dict[str, list[bool]] = defaultdict(list)
        last_question_result: dict[int, bool] = {}
        last_question_seen: dict[int, datetime] = {}
        recent_question_exposure_count: dict[int, int] = defaultdict(int)
        for question_id, verdict, submitted_at, category, question_type in recent_submissions:
            is_correct = verdict in ("Accepted", "Correct")
            category_key = (category or "").strip().casefold()
            type_key = (question_type or "").strip().casefold()
            if category_key:
                recent_skill_results[category_key].append(is_correct)
            if type_key:
                recent_type_results[type_key].append(is_correct)
            if question_id is not None and question_id not in last_question_result:
                last_question_result[question_id] = is_correct
                last_question_seen[question_id] = submitted_at
            if question_id is not None:
                recent_question_exposure_count[question_id] += 1

        skill_accuracy = dict(lifetime_accuracy)
        for category, results in recent_skill_results.items():
            recent_accuracy = sum(results) / len(results)
            if category in lifetime_accuracy and len(results) >= 3:
                skill_accuracy[category] = 0.65 * recent_accuracy + 0.35 * lifetime_accuracy[category]
            else:
                skill_accuracy[category] = recent_accuracy
        type_accuracy = {
            question_type: sum(results) / len(results)
            for question_type, results in recent_type_results.items()
        }

        exposure_result = await db.execute(
            select(QuestionExposure).where(
                QuestionExposure.user_id == user_id,
                QuestionExposure.question_id.in_(question_ids),
            )
        )
        exposures = {
            exposure.question_id: exposure
            for exposure in exposure_result.scalars().all()
        }

        now = datetime.utcnow()
        selected_ids: set[int] = set()
        selected_categories: dict[str, int] = defaultdict(int)
        selected_types: dict[str, int] = defaultdict(int)
        resolved_sections: list[dict[str, Any]] = []

        for section_index, section in enumerate(sections_config):
            question_type = str(section.get("question_type", "coding")).casefold()
            required_count = int(section.get("question_count", 1))
            category_filter = (section.get("skill_category") or "").strip().casefold()
            section_candidates = candidates_by_type.get(question_type, [])
            if category_filter:
                matching = [
                    question for question in section_candidates
                    if (question.skill_category or "").strip().casefold() == category_filter
                ]
                if len(matching) >= required_count:
                    section_candidates = matching

            section_questions: list[Question] = []
            for _ in range(required_count):
                ranked = []
                for question in section_candidates:
                    if question.id in selected_ids:
                        continue
                    exposure = exposures.get(question.id)
                    score = score_question(
                        question,
                        skill_accuracy=skill_accuracy.get((question.skill_category or "").strip().casefold()),
                        type_accuracy=type_accuracy.get(question_type),
                        last_seen_at=(
                            exposure.last_seen_at
                            if exposure
                            else last_question_seen.get(question.id)
                        ),
                        exposure_count=(
                            exposure.exposure_count
                            if exposure
                            else recent_question_exposure_count.get(question.id, 0)
                        ),
                        last_question_correct=last_question_result.get(question.id),
                        requested_difficulty=str(section.get("difficulty") or difficulty),
                        now=now,
                        selected_categories=selected_categories,
                        selected_types=selected_types,
                    )
                    ranked.append((score, question.id, question))
                if not ranked:
                    break
                _, _, selected = max(ranked, key=lambda item: (item[0], -item[1]))
                section_questions.append(selected)
                selected_ids.add(selected.id)
                selected_categories[(selected.skill_category or "").strip().casefold()] += 1
                selected_types[question_type] += 1

            if len(section_questions) < required_count:
                raise ValueError(
                    f"Not enough validated {question_type} questions for this battle section "
                    f"(required {required_count}, available {len(section_questions)})."
                )

            resolved_sections.append({
                "section_index": section_index,
                "title": section.get("title", f"Section {section_index + 1}"),
                "question_type": question_type,
                "skill_category": section.get("skill_category"),
                "weight": section.get("weight", 1.0),
                "duration_minutes": section.get("duration_minutes", 10),
                "negative_marking": section.get("negative_marking", False),
                "questions": [
                    {
                        "id": question.id,
                        "title": question.title,
                        "description": question.description,
                        "difficulty": question.difficulty,
                        "question_type": question.question_type,
                        "options": question.options or [],
                        "correct_option": question.correct_option,
                        "buggy_code": question.buggy_code or "",
                        "fixed_code_reference": question.fixed_code_reference or "",
                        "rubric": question.rubric or {},
                        "explanation": question.explanation or "",
                        "skill_category": question.skill_category or "Problem Solving",
                        "topic_tags": question.topic_tags or [],
                        "examples": question.examples or [],
                        "constraints": question.constraints or "",
                    }
                    for question in section_questions
                ],
            })

        logger.info(
            "adaptive_selection_completed user_id=%s question_count=%d",
            user_id,
            len(selected_ids),
        )
        return resolved_sections

    async def record_question_exposures(
        self,
        db: AsyncSession,
        user_id: str,
        questions_data: List[Dict[str, Any]],
    ) -> None:
        question_ids = {
            question.get("id")
            for section in questions_data
            for question in section.get("questions", [])
            if question.get("id") is not None
        }
        if not question_ids:
            return
        result = await db.execute(
            select(QuestionExposure).where(
                QuestionExposure.user_id == user_id,
                QuestionExposure.question_id.in_(question_ids),
            )
        )
        existing = {item.question_id: item for item in result.scalars().all()}
        now = datetime.utcnow()
        for question_id in question_ids:
            exposure = existing.get(question_id)
            if exposure is None:
                db.add(QuestionExposure(
                    user_id=user_id,
                    question_id=question_id,
                    first_seen_at=now,
                    last_seen_at=now,
                    exposure_count=1,
                ))
            else:
                exposure.last_seen_at = now
                exposure.exposure_count += 1

    async def record_question_result(
        self,
        db: AsyncSession,
        user_id: str,
        question_id: int,
        verdict: str,
        score: float,
    ) -> None:
        result = await db.execute(
            select(QuestionExposure).where(
                QuestionExposure.user_id == user_id,
                QuestionExposure.question_id == question_id,
            )
        )
        exposure = result.scalar_one_or_none()
        now = datetime.utcnow()
        if exposure is None:
            exposure = QuestionExposure(
                user_id=user_id,
                question_id=question_id,
                first_seen_at=now,
                last_seen_at=now,
                exposure_count=1,
            )
            db.add(exposure)
        exposure.attempt_count += 1
        is_correct = verdict in ("Accepted", "Correct")
        exposure.correct_count += int(is_correct)
        exposure.incorrect_count += int(not is_correct)
        exposure.last_result = "correct" if is_correct else "incorrect"
        exposure.last_score = score


    def validate_question_data(self, data: Dict[str, Any]) -> bool:
        """Canonical validation for all supported question types in battle and assessment flows."""
        return QuestionValidationService.validate_question_data(data)

    def get_default_assessment_sections(self, assessment_type: str = "practice") -> List[Dict[str, Any]]:
        """Return a canonical section mix used for practice, battle, and placement assessments."""
        normalized = (assessment_type or "practice").strip().lower()
        section_templates = {
            "practice": [
                {"title": "Warm-up", "question_type": "mcq", "question_count": 2, "skill_category": "Problem Solving", "weight": 0.2, "duration_minutes": 8, "negative_marking": False},
                {"title": "Coding", "question_type": "coding", "question_count": 2, "skill_category": "Data Structures", "weight": 0.5, "duration_minutes": 18, "negative_marking": False},
                {"title": "Concept Review", "question_type": "technical", "question_count": 1, "skill_category": "System Design", "weight": 0.3, "duration_minutes": 10, "negative_marking": False},
            ],
            "battle": [
                {"title": "Quick Recall", "question_type": "mcq", "question_count": 2, "skill_category": "Problem Solving", "weight": 0.2, "duration_minutes": 10, "negative_marking": False},
                {"title": "Implementation", "question_type": "coding", "question_count": 2, "skill_category": "Algorithms", "weight": 0.5, "duration_minutes": 20, "negative_marking": False},
                {"title": "Debugging", "question_type": "debugging", "question_count": 1, "skill_category": "Bug Analysis", "weight": 0.3, "duration_minutes": 10, "negative_marking": False},
            ],
            "placement": [
                {"title": "Aptitude", "question_type": "aptitude", "question_count": 2, "skill_category": "Aptitude", "weight": 0.25, "duration_minutes": 10, "negative_marking": False},
                {"title": "SQL", "question_type": "sql", "question_count": 1, "skill_category": "SQL", "weight": 0.2, "duration_minutes": 10, "negative_marking": False},
                {"title": "Coding", "question_type": "coding", "question_count": 2, "skill_category": "Data Structures", "weight": 0.4, "duration_minutes": 18, "negative_marking": False},
                {"title": "Technical", "question_type": "technical", "question_count": 1, "skill_category": "Core CS", "weight": 0.15, "duration_minutes": 8, "negative_marking": False},
            ],
            "reassessment": [
                {"title": "Concept Check", "question_type": "technical", "question_count": 2, "skill_category": "Core CS", "weight": 0.25, "duration_minutes": 10, "negative_marking": False},
                {"title": "Bug Fix", "question_type": "debugging", "question_count": 1, "skill_category": "Bug Analysis", "weight": 0.2, "duration_minutes": 8, "negative_marking": False},
                {"title": "Implementation", "question_type": "coding", "question_count": 2, "skill_category": "Algorithms", "weight": 0.4, "duration_minutes": 18, "negative_marking": False},
                {"title": "Logic", "question_type": "mcq", "question_count": 1, "skill_category": "Problem Solving", "weight": 0.15, "duration_minutes": 8, "negative_marking": False},
            ],
        }
        return section_templates.get(normalized, section_templates["practice"]) 

    def is_question_duplicate(self, data: Dict[str, Any], existing_candidates: List[Dict[str, Any]]) -> bool:
        """Offer a shared duplicate-detection hook without forcing a new question model."""
        return QuestionValidationService.find_duplicate_question(data, existing_candidates)

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
                "examples": parsed.get("examples", []),
                "hidden_test_cases": parsed.get("hidden_test_cases", []),
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
                examples=q_data["examples"],
                hidden_test_cases=q_data["hidden_test_cases"],
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
        stmt = select(Question).where(
            Question.question_type == question_type,
            Question.is_active.is_(True),
            Question.is_validated.is_(True),
        ).order_by(Question.id).limit(DEFAULT_SELECTION_POLICY.candidate_limit)
        res = await db.execute(stmt)
        eligible = [
            question
            for question in res.scalars().all()
            if self._is_adaptively_eligible(question)
        ]
        if eligible:
            return eligible[0]

        if question_type.casefold() == "coding":
            raise ValueError(
                "No validated coding question with executable test cases is available."
            )

        # Emergency synthetic question
        fallback = Question(
            title=f"Sample {question_type.upper()} Question",
            slug=f"sample-{question_type}-{func.random()}",
            description=f"Analyze the following {question_type} concept.",
            difficulty=difficulty,
            question_type=question_type,
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
        Shortages are treated as real inventory problems, not silently filled with generated data.
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
            ]
            if skill_category:
                filters.append(func.lower(Question.skill_category) == skill_category.casefold())
            stmt = (
                select(Question)
                .where(*filters)
                .order_by(Question.id)
                .limit(DEFAULT_SELECTION_POLICY.candidate_limit)
            )
            result = await db.execute(stmt)
            qs = [
                question
                for question in result.scalars().all()
                if self._is_adaptively_eligible(question)
            ]

            if len(qs) < count:
                raise ValueError(
                    f"Not enough validated {qtype} questions for this battle section "
                    f"(required {count}, available {len(qs)})."
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
                    # Hide authoritative answers from student during test
                    q_copy.pop("correct_option", None)
                    q_copy.pop("fixed_code_reference", None)
                    q_copy.pop("hidden_test_cases", None)
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
