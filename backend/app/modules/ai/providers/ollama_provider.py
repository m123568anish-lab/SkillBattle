"""
=========================================================

SkillBattle

Ollama Provider

=========================================================
"""

from __future__ import annotations

import httpx

from .base import AIProvider


class OllamaProvider(AIProvider):

    def __init__(

        self,

        model: str = "llama3",

        host: str = "http://localhost:11434",

    ):

        self.model = model

        self.host = host

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