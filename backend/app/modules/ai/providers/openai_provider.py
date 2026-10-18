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
        raise NotImplementedError("The OpenAI provider integration is not implemented.")