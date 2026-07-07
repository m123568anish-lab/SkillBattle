from __future__ import annotations

import requests

from app.core.config import settings


class MentorService:
    """
    AI Career Mentor Service
    Uses Ollama for answering questions.
    """

    def __init__(self) -> None:
        self.url = f"{settings.OLLAMA_URL}/api/generate"
        self.model = settings.OLLAMA_MODEL

    def build_prompt(
        self,
        question: str,
        resume_context: str = "",
    ) -> str:

        prompt = f"""
You are SkillBattle AI Career Mentor.

Answer professionally.

Resume Context:

{resume_context}

User Question:

{question}

Rules:

1. Be helpful.
2. Be concise.
3. Give practical advice.
4. If resume context exists,
   personalize the answer.
"""

        return prompt

    def ask(
        self,
        question: str,
        resume_context: str = "",
    ) -> str:

        prompt = self.build_prompt(
            question,
            resume_context,
        )

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
        }

        response = requests.post(
            self.url,
            json=payload,
            timeout=120,
        )

        response.raise_for_status()

        data = response.json()

        return data.get("response", "")


mentor_service = MentorService()