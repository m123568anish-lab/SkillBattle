"""
=========================================================

SkillBattle

OpenAI Provider

=========================================================
"""

from __future__ import annotations

import httpx

from app.core.config import settings

from .base import AIProvider


class OpenAIProvider(AIProvider):

    async def generate(self, prompt: str) -> str:
        if not settings.OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY is not configured.")

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                json={
                    "model": settings.OPENAI_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.2,
                },
            )
            response.raise_for_status()

        choices = response.json().get("choices")
        if not isinstance(choices, list) or not choices:
            raise ValueError("OpenAI returned no completion choices.")
        message = choices[0].get("message", {})
        content = message.get("content") if isinstance(message, dict) else None
        if not isinstance(content, str) or not content.strip():
            raise ValueError("OpenAI returned an empty completion.")
        return content.strip()