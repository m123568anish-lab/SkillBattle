def build_prompt(
    language: str,
    problem: str,
    source_code: str,
):

    return f"""
Problem

{problem}

Language

{language}

Code

{source_code}

Review this code.

Return JSON only.
"""