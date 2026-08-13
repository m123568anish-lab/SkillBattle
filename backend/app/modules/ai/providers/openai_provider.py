"""
=========================================================

SkillBattle

OpenAI Provider

=========================================================
"""

from __future__ import annotations

from .base import AIProvider


class OpenAIProvider(AIProvider):

    async def generate(
        self,
        prompt: str,
    ) -> str:
        # Minimal placeholder implementation — return informative message.
        if not prompt:
            return ""
        return f"[openai-placeholder] {prompt}"