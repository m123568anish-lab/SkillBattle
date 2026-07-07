import json

from app.ai.client import ai_client

from .builder import build_prompt

from .prompts import SYSTEM_PROMPT


class ProblemGeneratorService:

    async def generate(

        self,

        difficulty,

        topic,

        company=None,

    ):

        prompt = build_prompt(

            difficulty,

            topic,

            company,

        )

        response = await ai_client.chat(

            system_prompt=SYSTEM_PROMPT,

            user_prompt=prompt,

        )

        return json.loads(response)


problem_generator_service = ProblemGeneratorService()