import json

from sqlalchemy.orm import Session

from app.ai.client import ai_client

from .repository import recruiter_repository
from .builder import build_prompt
from .prompts import SYSTEM_PROMPT


class RecruiterService:

    async def generate_report(
        self,
        db: Session,
        user_id: str,
    ):

        candidate = recruiter_repository.get_candidate(
            db,
            user_id,
        )

        if candidate is None:
            raise ValueError("Candidate not found.")

        prompt = build_prompt(candidate)

        response = await ai_client.chat(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=prompt,
        )

        return json.loads(response)


recruiter_service = RecruiterService()