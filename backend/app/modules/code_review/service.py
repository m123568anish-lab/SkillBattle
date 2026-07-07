import json

from app.ai.client import ai_client

from .builder import build_prompt

from .prompts import SYSTEM_PROMPT


class CodeReviewService:

    async def review(
        self,
        language,
        source_code,
        problem,
    ):

        prompt = build_prompt(
            language,
            problem,
            source_code,
        )

        response = await ai_client.chat(

            system_prompt=SYSTEM_PROMPT,

            user_prompt=prompt,

        )

        return json.loads(response)


code_review_service = CodeReviewService()