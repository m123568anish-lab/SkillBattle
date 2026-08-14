def build_prompt(candidate):

    return f"""
Candidate

Name: {candidate.full_name}

Email: {candidate.email}

Analyze this candidate based on the available coding performance.

Return valid JSON only.
"""