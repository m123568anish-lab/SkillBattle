def build_prompt(
    difficulty: str,
    topic: str,
    company: str | None,
):

    company_text = ""

    if company:

        company_text = f"Company: {company}"

    return f"""

Generate a coding interview problem.

Difficulty:

{difficulty}

Topic:

{topic}

{company_text}

Return valid JSON only.

"""