import json

from app.ai.client import ai_client

from .builder import build_prompt
from .prompts import SYSTEM_PROMPT


class LearningEngineService:

    async def generate_plan(
        self,
        request,
    ):

        prompt = build_prompt(request)

        response = await ai_client.chat(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=prompt,
        )

        return json.loads(response)


learning_engine_service = LearningEngineService()