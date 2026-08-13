"""
=========================================================

SkillBattle

AI Interview Coach

Production Version

=========================================================
"""

from __future__ import annotations

from app.modules.ai.provider import (
    ai_provider,
)

from app.modules.ai.prompts import (
    prompt_builder,
)


class InterviewCoach:

    # =====================================================
    # Generate Interview
    # =====================================================

    async def generate(
        self,
        role: str,
    ):

        prompt = prompt_builder.interview(
            role,
        )

        return await ai_provider.generate(
            prompt,
        )

    # =====================================================
    # Evaluate Answer
    # =====================================================

    async def evaluate(
        self,
        question: str,
        answer: str,
    ):

        prompt = f"""
You are a Senior Technical Interviewer.

Question:

{question}

Candidate Answer:

{answer}

Evaluate:

1. Correctness

2. Communication

3. Confidence

4. Improvements

5. Score out of 10

Provide detailed feedback.
"""

        return await ai_provider.generate(
            prompt,
        )


interview_coach = InterviewCoach()