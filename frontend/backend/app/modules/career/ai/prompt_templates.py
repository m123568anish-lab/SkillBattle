"""
=========================================================

SkillBattle

AI Prompt Templates

Reusable prompts for every AI feature.

=========================================================
"""

from __future__ import annotations


class PromptTemplates:

    # =====================================================
    # Resume Analysis
    # =====================================================

    @staticmethod
    def resume_analysis(
        resume_text: str,
    ) -> str:

        return f"""
You are an expert technical recruiter.

Analyze the following resume.

Return ONLY valid JSON.

Required JSON format:

{{
    "summary": "",
    "strengths": [],
    "weaknesses": [],
    "missing_skills": [],
    "improvement_suggestions": [],
    "resume_score": 0
}}

Resume:

{resume_text}
"""

    # =====================================================
    # ATS Analysis
    # =====================================================

    @staticmethod
    def ats_analysis(
        resume_text: str,
    ) -> str:

        return f"""
You are an ATS Resume Expert.

Evaluate the resume.

Return ONLY JSON.

{{
    "ats_score":0,
    "keyword_score":0,
    "formatting_score":0,
    "missing_keywords":[],
    "recommendations":[]
}}

Resume:

{resume_text}
"""

    # =====================================================
    # Job Matching
    # =====================================================

    @staticmethod
    def job_matching(
        resume_text: str,
    ) -> str:

        return f"""
You are a career advisor.

Recommend the five best job roles.

Return JSON only.

{{
    "roles":[],
    "confidence":[],
    "reason":[]
}}

Resume:

{resume_text}
"""

    # =====================================================
    # Placement Readiness
    # =====================================================

    @staticmethod
    def placement_score(
        resume_text: str,
    ) -> str:

        return f"""
Evaluate placement readiness.

Return JSON.

{{
    "placement_score":0,
    "technical_score":0,
    "communication_score":0,
    "project_score":0,
    "recommendations":[]
}}

Resume:

{resume_text}
"""

    # =====================================================
    # Learning Roadmap
    # =====================================================

    @staticmethod
    def roadmap(
        resume_text: str,
    ) -> str:

        return f"""
Create a personalized roadmap.

Return JSON.

{{
    "roadmap":[
        {{
            "title":"",
            "duration":"",
            "resources":[]
        }}
    ]
}}

Resume:

{resume_text}
"""

    # =====================================================
    # Career Mentor
    # =====================================================

    @staticmethod
    def mentor(
        resume_text: str,
        question: str,
    ) -> str:

        return f"""
You are an experienced career mentor.

Answer the question using the resume.

Resume:

{resume_text}

Question:

{question}
"""

    # =====================================================
    # Portfolio Review
    # =====================================================

    @staticmethod
    def portfolio(
        resume_text: str,
    ) -> str:

        return f"""
Evaluate the candidate portfolio.

Return JSON.

{{
    "portfolio_score":0,
    "project_quality":0,
    "github_score":0,
    "recommendations":[]
}}

Resume:

{resume_text}
"""


prompts = PromptTemplates()