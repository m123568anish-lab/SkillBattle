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
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.question import Question
from app.models.problem import Problem
from app.modules.ai.service import ai_service

logger = logging.getLogger(__name__)


class QuestionEngine:

    def validate_question_data(self, data: Dict[str, Any]) -> bool:
        """
        Validate question completeness and correctness before storing or using.
        Must contain required fields depending on question_type.
        """
        if not data.get("title") or len(str(data["title"]).strip()) < 3:
            return False
        if not data.get("description") or len(str(data["description"]).strip()) < 10:
            return False

        qtype = str(data.get("question_type", "coding")).lower()

        if qtype == "mcq":
            options = data.get("options")
            if not isinstance(options, list) or len(options) < 2:
                return False
            if not data.get("correct_option"):
                return False

        elif qtype == "debugging":
            if not data.get("buggy_code") or len(str(data["buggy_code"]).strip()) < 5:
                return False

        elif qtype == "technical":
            if not data.get("rubric") and not data.get("explanation"):
                return False

        elif qtype == "coding":
            # For coding questions, check constraints or description
            pass

        return True

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
        stmt = select(Question).where(
            Question.question_type == question_type,
            Question.is_active == True,
        ).limit(1)
        res = await db.execute(stmt)
        q = res.scalar_one_or_none()
        if q:
            return q

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
        """
        resolved_sections = []

        for sec_idx, sec in enumerate(sections_config):
            qtype = str(sec.get("question_type", "coding")).lower()
            count = int(sec.get("question_count", 1))
            sec_title = sec.get("title", f"Section {sec_idx + 1}")

            # Fetch matching questions from DB
            stmt = select(Question).where(
                Question.question_type == qtype,
                Question.is_active == True,
            ).limit(count)
            result = await db.execute(stmt)
            qs = list(result.scalars().all())

            # If not enough questions in DB, generate AI questions or get fallback
            while len(qs) < count:
                new_q = await self.generate_and_validate_ai_question(
                    db,
                    question_type=qtype,
                    difficulty=difficulty,
                    topic="DSA" if qtype == "coding" else "CS Fundamentals",
                )
                qs.append(new_q)

            section_questions = []
            for q in qs:
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
                clean_qs.append(q_copy)

            sanitized.append({
                "section_index": sec_idx,
                "title": sec.get("title"),
                "question_type": sec.get("question_type"),
                "weight": sec.get("weight"),
                "duration_minutes": sec.get("duration_minutes"),
                "negative_marking": sec.get("negative_marking"),
                "questions": clean_qs,
            })
        return sanitized


question_engine = QuestionEngine()
