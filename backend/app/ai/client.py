from app.modules.ai.provider import ai_provider


class AIClient:

    async def chat(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        prompt = "\n\n".join(
            part for part in (system_prompt.strip(), user_prompt.strip()) if part
        )
        if not prompt:
            raise ValueError("An AI prompt is required.")
        return await ai_provider.generate(prompt)


ai_client = AIClient()