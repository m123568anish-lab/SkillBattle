def build_coach_prompt(
    profile: dict,
    xp: dict,
    streak: dict,
    goals: list[str],
    companies: list[str],
    languages: list[str],
):

    return f"""
You are SkillBattle AI Coach.

Student Profile

Name: {profile.get("name")}

College: {profile.get("college")}

Dream Companies:
{companies}

Programming Languages:
{languages}

Learning Goals:
{goals}

XP:
{xp.get("total_xp")}

Level:
{xp.get("level")}

Current Streak:
{streak.get("current_streak")}

Generate ONLY valid JSON.

Format:

{{
"study_plan":[],
"weak_topics":[],
"coding_challenge":"",
"motivation":"",
"company_strategy":"",
"next_milestone":""
}}
"""