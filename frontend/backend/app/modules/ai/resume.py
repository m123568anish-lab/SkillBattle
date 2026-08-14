"""
=========================================================

SkillBattle

Resume Review AI

=========================================================
"""

from __future__ import annotations

from app.modules.ai.provider import (
    ai_provider,
)

from app.modules.ai.prompts import (
    prompt_builder,
)


class ResumeAI:

    async def review(
        self,
        resume_text: str,
    ):

        prompt = prompt_builder.resume(
            resume_text,
        )

        return await ai_provider.generate(
            prompt,
        )


resume_ai = ResumeAI()