"""
=========================================================

SkillBattle Career Platform

Central Prompt Library

Shared by:
- Resume Screening
- Career Mentor
- ATS Optimizer
- Job Matcher
- Interview Coach
- Cover Letter Generator

=========================================================
"""

from __future__ import annotations

from string import Template


class CareerPrompts:

    # =====================================================
    # Resume Review
    # =====================================================

    RESUME_REVIEW = Template("""
You are an expert Senior Software Engineering Recruiter.

Review the following resume.

Candidate Resume

$resume

Return JSON only.

{
  "summary":"",
  "strengths":[],
  "weaknesses":[],
  "missing_sections":[],
  "ats_score":0,
  "recommendations":[]
}
""")

    # =====================================================
    # ATS Optimization
    # =====================================================

    ATS_OPTIMIZER = Template("""
You are an ATS optimization expert.

Resume

$resume

Target Job

$job

Return JSON.

{
  "score":0,
  "missing_keywords":[],
  "keyword_density":{},
  "recommended_changes":[]
}
""")

    # =====================================================
    # Resume Rewrite
    # =====================================================

    RESUME_REWRITE = Template("""
Rewrite the resume professionally.

Requirements

• Keep all facts accurate.
• Improve grammar.
• Use stronger action verbs.
• Keep ATS friendly.
• Do not invent experience.

Resume

$resume
""")

    # =====================================================
    # Job Matching
    # =====================================================

    JOB_MATCH = Template("""
Compare candidate with job.

Resume

$resume

Job Description

$job

Return JSON.

{
 "match_percentage":0,
 "matching_skills":[],
 "missing_skills":[],
 "recommendations":[]
}
""")

    # =====================================================
    # Skill Gap
    # =====================================================

    SKILL_GAP = Template("""
Analyze missing skills.

Current Skills

$skills

Target Role

$role

Return JSON.

{
 "missing_skills":[],
 "priority_order":[],
 "projects":[],
 "courses":[]
}
""")

    # =====================================================
    # Career Mentor
    # =====================================================

    CAREER_MENTOR = Template("""
You are an experienced Engineering Manager.

Candidate Profile

$profile

Question

$question

Answer professionally.

Provide:

1. Honest assessment

2. Step-by-step advice

3. Interview preparation

4. Learning roadmap

5. Motivation

Avoid generic advice.
""")

    # =====================================================
    # Interview Coach
    # =====================================================

    INTERVIEW = Template("""
You are a FAANG interviewer.

Role

$role

Experience

$experience

Ask one interview question.

Wait for candidate answer.

Then evaluate:

• Technical accuracy

• Communication

• Optimization

• Confidence

Score out of 10.
""")

    # =====================================================
    # Cover Letter
    # =====================================================

    COVER_LETTER = Template("""
Write a personalized cover letter.

Candidate

$profile

Company

$company

Role

$role

Professional tone.

Maximum 350 words.
""")

    # =====================================================
    # Learning Roadmap
    # =====================================================

    ROADMAP = Template("""
Create a roadmap.

Current Skills

$skills

Target Role

$role

Duration

$months months

Return JSON.

{
 "phase1":[],
 "phase2":[],
 "phase3":[],
 "projects":[],
 "certifications":[]
}
""")

    # =====================================================
    # Placement Readiness
    # =====================================================

    PLACEMENT = Template("""
Evaluate placement readiness.

Candidate

$profile

Return JSON.

{
 "placement_score":0,
 "strengths":[],
 "weaknesses":[],
 "next_steps":[]
}
""")

    # =====================================================
    # Portfolio Review
    # =====================================================

    PORTFOLIO = Template("""
Review portfolio.

Projects

$projects

Return JSON.

{
 "portfolio_score":0,
 "strengths":[],
 "weaknesses":[],
 "recommendations":[]
}
""")


career_prompts = CareerPrompts()