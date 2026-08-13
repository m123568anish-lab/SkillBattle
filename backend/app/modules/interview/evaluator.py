"""
=========================================================

SkillBattle

Interview Evaluator

Production Version

=========================================================
"""

from __future__ import annotations

import json

from app.modules.ai.provider import (
    ai_provider,
)


class InterviewEvaluator:

    """
    AI-based interview evaluator.
    """

    async def evaluate(

        self,

        question: str,

        code: str,

        language: str,

        compiler_output: str,

        tests_passed: bool,

    ):

        prompt = f"""
You are a Senior Software Engineer conducting a coding interview.

Evaluate the candidate's submission.

Question:
{question}

Language:
{language}

Code:
{code}

Compiler Output:
{compiler_output}

Passed Tests:
{tests_passed}

Return ONLY valid JSON.

{{
    "correctness": 0-100,
    "time_complexity": "...",
    "space_complexity": "...",
    "readability": 0-100,
    "naming": 0-100,
    "optimization": "...",
    "bugs": "...",
    "strengths": [
        ...
    ],
    "improvements": [
        ...
    ],
    "recommendation": "...",
    "overall_score": 0-100
}}
"""

        response = await ai_provider.generate(
            prompt,
        )

        try:

            return json.loads(response)

        except Exception:

            return {

                "correctness": 0,

                "overall_score": 0,

                "recommendation": "Unable to evaluate.",

                "raw_response": response,

            }


interview_evaluator = InterviewEvaluator()