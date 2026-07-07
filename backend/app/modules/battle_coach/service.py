import json

from app.ai.client import ai_client

from .builder import build_prompt

from .prompts import SYSTEM_PROMPT


class BattleCoachService:

    async def analyze(
        self,
        request,
    ):

        prompt = build_prompt(request)

        response = await ai_client.chat(

            system_prompt=SYSTEM_PROMPT,

            user_prompt=prompt,

        )

        return json.loads(response)


battle_coach_service = BattleCoachService()