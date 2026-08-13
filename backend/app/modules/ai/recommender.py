"""
=========================================================

SkillBattle

AI Learning Recommender

=========================================================
"""

from __future__ import annotations

from app.modules.ai.provider import (
    ai_provider,
)

from app.modules.ai.prompts import (
    prompt_builder,
)


class LearningRecommender:

    async def recommend(
        self,
        topic: str,
    ):

        prompt = prompt_builder.recommendation(
            topic,
        )

        return await ai_provider.generate(
            prompt,
        )

    async def projects(
        self,
        role: str,
    ):

        prompt = f"""
Suggest five portfolio projects for

{role}

Each project should include:

Title

Difficulty

Technologies

Skills Learned

Resume Impact
"""

        return await ai_provider.generate(
            prompt,
        )

    async def company_preparation(
        self,
        company: str,
    ):

        prompt = f"""
Create a preparation roadmap for

{company}

Include:

DSA

SQL

Machine Learning

System Design

Behavioral

Interview Tips

Timeline
"""

        return await ai_provider.generate(
            prompt,
        )


learning_recommender = LearningRecommender()