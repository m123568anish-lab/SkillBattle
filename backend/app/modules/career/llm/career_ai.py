"""
=========================================================

SkillBattle Career Platform

Unified AI Gateway

Supports

✔ Ollama
✔ OpenAI
✔ Gemini
✔ Claude

=========================================================
"""

from __future__ import annotations

import os
from typing import Literal

import httpx

Provider = Literal[
    "ollama",
    "openai",
    "gemini",
    "claude",
]


class CareerAI:

    def __init__(self):

        self.provider = os.getenv(
            "CAREER_AI_PROVIDER",
            "ollama",
        )

        self.timeout = 120

        self.ollama_url = os.getenv(
            "OLLAMA_URL",
            "http://localhost:11434/api/generate",
        )

        self.ollama_model = os.getenv(
            "OLLAMA_MODEL",
            "llama3.1:8b",
        )

    # --------------------------------------------------

    async def generate(

        self,

        prompt: str,

        temperature: float = 0.2,

    ) -> str:

        provider = self.provider.lower()

        if provider == "ollama":

            return await self._ollama(

                prompt,

                temperature,

            )

        if provider == "openai":

            return await self._openai(

                prompt,

                temperature,

            )

        if provider == "gemini":

            return await self._gemini(

                prompt,

                temperature,

            )

        if provider == "claude":

            return await self._claude(

                prompt,

                temperature,

            )

        raise ValueError(

            f"Unknown provider: {provider}"

        )

    # --------------------------------------------------

    async def _ollama(

        self,

        prompt: str,

        temperature: float,

    ) -> str:

        payload = {

            "model": self.ollama_model,

            "prompt": prompt,

            "stream": False,

            "options": {

                "temperature": temperature,

            },

        }

        async with httpx.AsyncClient(

            timeout=self.timeout,

        ) as client:

            response = await client.post(

                self.ollama_url,

                json=payload,

            )

            response.raise_for_status()

            return response.json()["response"]

    # --------------------------------------------------

    async def _openai(

        self,

        prompt: str,

        temperature: float,

    ) -> str:

        raise NotImplementedError(

            "OpenAI provider will be implemented."

        )

    # --------------------------------------------------

    async def _gemini(

        self,

        prompt: str,

        temperature: float,

    ) -> str:

        raise NotImplementedError(

            "Gemini provider will be implemented."

        )

    # --------------------------------------------------

    async def _claude(

        self,

        prompt: str,

        temperature: float,

    ) -> str:

        raise NotImplementedError(

            "Claude provider will be implemented."

        )


career_ai = CareerAI()