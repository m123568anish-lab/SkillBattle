"""
=========================================================

SkillBattle

AI Prompt Builder

Production Version

=========================================================
"""

from __future__ import annotations


def build_prompt(
    difficulty: str,
    topic: str,
    company: str | None = None,
    rating: int | None = None,
) -> str:

    company_text = ""

    if company:
        company_text = f"""
Target Company:
{company}
"""

    rating_text = ""

    if rating:
        rating_text = f"""
Estimated Difficulty Rating:
{rating}
"""

    return f"""
Generate ONE original competitive programming problem.

Requirements:

- Difficulty: {difficulty}

- Topic: {topic}

{company_text}

{rating_text}

Rules:

1. Never copy existing LeetCode, Codeforces or HackerRank problems.

2. Create a unique title.

3. Include realistic constraints.

4. Include hidden edge cases.

5. Generate optimized solution.

6. Generate starter code for:

- Python
- C++
- Java

7. Include hints.

8. Include editorial.

9. Output VALID JSON ONLY.

Return this structure:

{{
"title":"",
"difficulty":"",
"topic":"",
"statement":"",
"constraints":"",
"input_format":"",
"output_format":"",
"examples":[],
"hidden_testcases":[],
"starter_code":{{}},
"solution":"",
"editorial":"",
"hints":[],
"estimated_rating":0,
"tags":[],
"time_limit":2,
"memory_limit":256
}}
"""