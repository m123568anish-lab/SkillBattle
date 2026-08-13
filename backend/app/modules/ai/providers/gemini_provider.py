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
        # Minimal placeholder implementation — return informative message.
        if not prompt:
            return ""
        return f"[gemini-placeholder] {prompt}"