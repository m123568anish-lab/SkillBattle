"""
=========================================================

SkillBattle

Gemini Provider

=========================================================
"""

from __future__ import annotations

from .base import AIProvider


class GeminiProvider(AIProvider):

    async def generate(
        self,
        prompt: str,
    ) -> str:
        raise NotImplementedError("The Gemini provider integration is not implemented.")