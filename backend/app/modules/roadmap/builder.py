"""
==========================================================
Roadmap Prompt Builder
==========================================================
"""

from app.modules.roadmap.prompts import (
    ROADMAP_SYSTEM_PROMPT,
)


class RoadmapPromptBuilder:

    @staticmethod
    def build(
        *,
        profile: dict,
        xp: dict,
        streak: dict,
        goals: list,
        companies: list,
        languages: list,
        memory: str,
        duration: int,
    ) -> str:

        return f"""
{ROADMAP_SYSTEM_PROMPT}

==========================================================
Student Profile
==========================================================

Name

{profile.get("name")}

College

{profile.get("college")}

Current Level

{xp.get("level")}

Current XP

{xp.get("total_xp")}

Current Streak

{streak.get("current_streak")}

Dream Companies

{", ".join(companies)}

Programming Languages

{", ".join(languages)}

Learning Goals

{", ".join(goals)}

Previous AI Memory

{memory}

==========================================================
Roadmap Requirements
==========================================================

Duration

{duration} Weeks

Generate:

Weekly Objectives

Daily Tasks

Difficulty Progression

Interview Milestones

Revision Weeks

Coding Challenge Suggestions

Mock Interview Weeks

Company Preparation

Return ONLY VALID JSON.
"""