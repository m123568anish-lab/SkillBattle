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
from .request import request_with_retries


class OpenAIProvider(AIProvider):

    async def generate(self, prompt: str) -> str:
        if not settings.OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY is not configured.")

        timeout = httpx.Timeout(
            connect=settings.AI_PROVIDER_CONNECT_TIMEOUT_SECONDS,
            read=settings.AI_PROVIDER_READ_TIMEOUT_SECONDS,
            write=settings.AI_PROVIDER_CONNECT_TIMEOUT_SECONDS,
            pool=settings.AI_PROVIDER_CONNECT_TIMEOUT_SECONDS,
        )
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await request_with_retries(
                lambda: client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                    json={
                        "model": settings.OPENAI_MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.2,
                    },
                )
            )

        choices = response.json().get("choices")
        if not isinstance(choices, list) or not choices:
            raise ValueError("OpenAI returned no completion choices.")
        message = choices[0].get("message", {})
        content = message.get("content") if isinstance(message, dict) else None
        if not isinstance(content, str) or not content.strip():
            raise ValueError("OpenAI returned an empty completion.")
        return content.strip()

    async def health_check(self) -> dict[str, str | bool]:
        if not settings.OPENAI_API_KEY:
            return {"available": False, "provider": "openai", "detail": "OPENAI_API_KEY is not configured."}
        timeout = httpx.Timeout(
            connect=settings.AI_PROVIDER_HEALTH_TIMEOUT_SECONDS,
            read=settings.AI_PROVIDER_HEALTH_TIMEOUT_SECONDS,
            write=settings.AI_PROVIDER_HEALTH_TIMEOUT_SECONDS,
            pool=settings.AI_PROVIDER_HEALTH_TIMEOUT_SECONDS,
        )
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                )
                response.raise_for_status()
            return {"available": True, "provider": "openai", "detail": f"HTTP {response.status_code}"}
        except (httpx.HTTPError, RuntimeError) as exc:
            return {"available": False, "provider": "openai", "detail": type(exc).__name__}