def build_prompt(request):

    return f"""
Problem

{request.problem_statement}

Player Code

{request.user_code}

Opponent Code

{request.opponent_code}

Player Result

{request.user_result}

Opponent Result

{request.opponent_result}

Player Execution Time

{request.user_execution_time}

Opponent Execution Time

{request.opponent_execution_time}

Analyze the battle.

Return JSON only.
"""