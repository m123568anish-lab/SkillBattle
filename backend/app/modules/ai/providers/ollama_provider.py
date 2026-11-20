"""
=========================================================

SkillBattle

Ollama Provider

=========================================================
"""

from __future__ import annotations

import httpx

from app.core.config import settings

from .base import AIProvider
from .request import request_with_retries


class OllamaProvider(AIProvider):

    def __init__(self, model: str | None = None, host: str | None = None):
        self.model = model or settings.OLLAMA_MODEL
        self.host = (host or settings.OLLAMA_URL).rstrip("/")

    async def generate(

        self,

        prompt: str,

    ) -> str:

        timeout = httpx.Timeout(
            connect=settings.AI_PROVIDER_CONNECT_TIMEOUT_SECONDS,
            read=settings.AI_PROVIDER_READ_TIMEOUT_SECONDS,
            write=settings.AI_PROVIDER_CONNECT_TIMEOUT_SECONDS,
            pool=settings.AI_PROVIDER_CONNECT_TIMEOUT_SECONDS,
        )
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await request_with_retries(
                lambda: client.post(
                    f"{self.host}/api/generate",
                    json={"model": self.model, "prompt": prompt, "stream": False},
                )
            )
        result = response.json().get("response")
        if not isinstance(result, str) or not result.strip():
            raise ValueError("Ollama returned an empty completion.")
        return result

    async def health_check(self) -> dict[str, str | bool]:
        timeout = httpx.Timeout(
            connect=settings.AI_PROVIDER_HEALTH_TIMEOUT_SECONDS,
            read=settings.AI_PROVIDER_HEALTH_TIMEOUT_SECONDS,
            write=settings.AI_PROVIDER_HEALTH_TIMEOUT_SECONDS,
            pool=settings.AI_PROVIDER_HEALTH_TIMEOUT_SECONDS,
        )
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(f"{self.host}/api/tags")
                response.raise_for_status()
            return {"available": True, "provider": "ollama", "detail": f"HTTP {response.status_code}"}
        except (httpx.HTTPError, RuntimeError) as exc:
            return {"available": False, "provider": "ollama", "detail": type(exc).__name__}