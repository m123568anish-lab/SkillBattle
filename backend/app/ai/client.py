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
        # Minimal safe implementation: return a simple combined echo response.
        # This keeps features working without a configured provider.
        system = system_prompt or ""
        user = user_prompt or ""
        return f"[ai-client-placeholder] system: {system} | user: {user}"


ai_client = AIClient()