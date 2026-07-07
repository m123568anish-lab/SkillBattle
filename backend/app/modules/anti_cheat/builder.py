def build_prompt(

    original,

    reference,

):

    return f"""

Solution A

{original}

Solution B

{reference}

Determine plagiarism.

Return JSON only.

"""