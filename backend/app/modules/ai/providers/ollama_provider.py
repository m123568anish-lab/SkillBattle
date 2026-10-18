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


class OllamaProvider(AIProvider):

    def __init__(self, model: str | None = None, host: str | None = None):
        self.model = model or settings.OLLAMA_MODEL
        self.host = (host or settings.OLLAMA_URL).rstrip("/")

    async def generate(

        self,

        prompt: str,

    ) -> str:

        async with httpx.AsyncClient() as client:

            response = await client.post(

                f"{self.host}/api/generate",

                json={

                    "model": self.model,

                    "prompt": prompt,

                    "stream": False,

                },

                timeout=300,

            )

            response.raise_for_status()

            return response.json()["response"]