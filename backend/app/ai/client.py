from typing import Optional


class AIClient:

    async def chat(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        """
        Placeholder implementation.
        Replace with OpenAI/Ollama/Gemini later.
        """
        raise NotImplementedError(
            "Configure an AI provider before using AI features."
        )


ai_client = AIClient()