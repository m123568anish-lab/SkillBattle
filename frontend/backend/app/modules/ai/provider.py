"""
=========================================================

SkillBattle

AI Provider Factory

=========================================================
"""

from __future__ import annotations

from app.core.config import settings

from app.modules.ai.providers import (

    OllamaProvider,

    OpenAIProvider,

    GeminiProvider,

)


class ProviderFactory:

    @staticmethod
    def get():

        provider = getattr(

            settings,

            "AI_PROVIDER",

            "ollama",

        ).lower()

        if provider == "ollama":

            return OllamaProvider()

        if provider == "openai":

            return OpenAIProvider()

        if provider == "gemini":

            return GeminiProvider()

        raise ValueError(

            f"Unsupported AI provider: {provider}"

        )


ai_provider = ProviderFactory.get()