"""
==========================================================
Interview Prompt Builder
==========================================================
"""

from app.modules.interview.prompts import (
    INTERVIEW_SYSTEM_PROMPT,
    ANSWER_EVALUATION_PROMPT,
)


class InterviewPromptBuilder:

    @staticmethod
    def build_interview_prompt(
        *,
        profile: dict,
        roadmap: dict,
        xp: dict,
        memory: str,
        company: str,
        role: str,
        interview_type: str,
        difficulty: str,
        total_questions: int,
    ):

        return f"""
{INTERVIEW_SYSTEM_PROMPT}

====================================================

Student

====================================================

Name

{profile.get("name")}

College

{profile.get("college")}

XP

{xp.get("total_xp")}

Level

{xp.get("level")}

Current Roadmap

{roadmap.get("title")}

Current Week

{roadmap.get("week")}

Weak Topics

{memory}

====================================================

Interview Configuration

====================================================

Company

{company}

Role

{role}

Interview Type

{interview_type}

Difficulty

{difficulty}

Questions

{total_questions}

Generate ONLY VALID JSON.
"""

    @staticmethod
    def build_evaluation_prompt(
        *,
        question: str,
        expected_topics: str,
        answer: str,
    ):

        return f"""
{ANSWER_EVALUATION_PROMPT}

Interview Question

{question}

Expected Topics

{expected_topics}

Student Answer

{answer}

Evaluate professionally.

Return ONLY JSON.
"""