"""
=========================================================

SkillBattle

Roadmap Generator

=========================================================
"""

from __future__ import annotations

from app.modules.ai.provider import (
    ai_provider,
)

from app.modules.ai.prompts import (
    prompt_builder,
)


class RoadmapGenerator:

    async def generate(

        self,

        role: str,

        level: str,

        weekly_hours: int,

    ):

        prompt = prompt_builder.roadmap(

            role,

            level,

            weekly_hours,

        )

        return await ai_provider.generate(

            prompt,

        )


roadmap_generator = RoadmapGenerator()