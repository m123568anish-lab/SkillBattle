"""
=========================================================

SkillBattle

AI Prompt Templates

=========================================================
"""

from __future__ import annotations


class PromptBuilder:

    @staticmethod
    def roadmap(
        role: str,
        level: str,
        hours: int,
    ) -> str:

        return f"""
You are an expert software engineering mentor.

Create a complete roadmap.

Target Role:
{role}

Current Level:
{level}

Weekly Study Hours:
{hours}

Include:

1. Skills

2. DSA

3. SQL

4. Projects

5. Resume Tips

6. Interview Preparation

7. Weekly Plan
"""

    @staticmethod
    def resume(
        resume: str,
    ) -> str:

        return f"""
Analyze this resume.

Provide:

ATS Score

Strengths

Weaknesses

Missing Skills

Projects to Add

Final Suggestions

Resume:

{resume}
"""

    @staticmethod
    def interview(
        role: str,
    ) -> str:

        return f"""
Generate ten interview questions for

{role}

Include:

Easy

Medium

Hard

Behavioral

Coding
"""

    @staticmethod
    def recommendation(
        topic: str,
    ) -> str:

        return f"""
Recommend learning resources for

{topic}

Include:

Books

Courses

Projects

LeetCode

YouTube

Documentation
"""


prompt_builder = PromptBuilder()