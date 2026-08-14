"""
=========================================================

Interview Question Generator

=========================================================
"""

from __future__ import annotations

from app.modules.ai.provider import (
    ai_provider,
)


class InterviewGenerator:

    async def generate_question(

        self,

        difficulty: str,

        language: str,

        topic: str,

    ):

        prompt = f"""
You are a Senior Software Engineer.

Generate ONE coding interview question.

Difficulty:
{difficulty}

Programming Language:
{language}

Topic:
{topic}

Return:

Title

Problem Statement

Input

Output

Constraints

Example

Expected Time Complexity

Expected Space Complexity
"""

        return await ai_provider.generate(
            prompt,
        )


interview_generator = InterviewGenerator()