import json

from app.ai.client import ai_client

from .normalizer import normalize

from .similarity import similarity

from .ast_parser import ast_dump

from .builder import build_prompt

from .prompts import SYSTEM_PROMPT


class AntiCheatService:

    async def detect(

        self,

        request,

    ):

        normalized_a = normalize(

            request.source_code,

        )

        normalized_b = normalize(

            request.reference_code,

        )

        text_similarity = similarity(

            normalized_a,

            normalized_b,

        )

        ast_similarity = similarity(

            ast_dump(normalized_a),

            ast_dump(normalized_b),

        )

        prompt = build_prompt(

            normalized_a,

            normalized_b,

        )

        ai = await ai_client.chat(

            system_prompt=SYSTEM_PROMPT,

            user_prompt=prompt,

        )

        report = json.loads(ai)

        report["text_similarity"] = round(

            text_similarity,

            2,

        )

        report["ast_similarity"] = round(

            ast_similarity,

            2,

        )

        return report


anti_cheat_service = AntiCheatService()