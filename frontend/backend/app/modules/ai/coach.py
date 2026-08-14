import json

from app.modules.ai.builder import (
    build_coach_prompt,
)

from app.modules.ai.service import (
    ai_service,
)


class AICoach:

    def generate(
        self,
        profile,
        xp,
        streak,
        goals,
        companies,
        languages,
    ):

        prompt = build_coach_prompt(
            profile,
            xp,
            streak,
            goals,
            companies,
            languages,
        )

        response = ai_service.generate_response(
            prompt,
        )

        try:

            return json.loads(response)

        except Exception:

            return {

                "study_plan": [],

                "weak_topics": [],

                "coding_challenge": "",

                "motivation": response,

                "company_strategy": "",

                "next_milestone": "",
            }


ai_coach = AICoach()