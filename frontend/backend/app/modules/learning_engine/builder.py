def build_prompt(request):

    return f"""
Interview Score:
{request.interview_score}

Battle Rating:
{request.battle_rating}

Solved Problems:
{request.solved_problems}

Accepted Submissions:
{request.accepted_submissions}

Strong Topics:
{request.strong_topics}

Weak Topics:
{request.weak_topics}

Recent AI Reviews:
{request.recent_reviews}

Battle Feedback:
{request.battle_feedback}

Generate a personalized study roadmap.

Return JSON only.
"""