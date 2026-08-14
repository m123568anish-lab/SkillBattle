"""
=========================================================

SkillBattle

LLM Client

Handles communication with Ollama.

=========================================================
"""

from __future__ import annotations

import httpx

from app.core.config import settings


class LLMClient:

    def __init__(self):

        self.base_url = settings.OLLAMA_URL.rstrip("/")

        self.model = settings.OLLAMA_MODEL

        self.timeout = 300

    # --------------------------------------------------

    async def generate(

        self,

        prompt: str,

        temperature: float = 0.2,

    ) -> str:

        payload = {

            "model": self.model,

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

                f"{self.base_url}/api/generate",

                json=payload,

            )

        response.raise_for_status()

        data = response.json()

        return data.get(

            "response",

            "",

        ).strip()

    # --------------------------------------------------

    async def health(self) -> bool:

        try:

            async with httpx.AsyncClient(

                timeout=5,

            ) as client:

                response = await client.get(

                    f"{self.base_url}/api/tags"

                )

            return response.status_code == 200

        except Exception:

            return False

    # --------------------------------------------------

    async def available_models(self):

        async with httpx.AsyncClient() as client:

            response = await client.get(

                f"{self.base_url}/api/tags"

            )

        response.raise_for_status()

        models = response.json()

        return [

            model["name"]

            for model in models.get(

                "models",

                [],

            )

        ]


llm_client = LLMClient()