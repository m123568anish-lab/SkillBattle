"""
=========================================================
SkillBattle Career Platform

ATS Engine

Analyzes resumes and generates an ATS score.

=========================================================
"""

from __future__ import annotations

import re

from app.modules.career.models.job import Job
from app.modules.career.models.resume import Resume


class ATSEngine:

    ACTION_VERBS = {

        "developed",
        "built",
        "implemented",
        "created",
        "optimized",
        "designed",
        "improved",
        "managed",
        "led",
        "automated",
        "deployed",
        "integrated",
        "analyzed",
        "trained",
        "engineered",
        "delivered",
        "reduced",
        "increased",
        "collaborated",
        "maintained",

    }

    SECTION_WEIGHTS = {

        "skills": 20,

        "projects": 20,

        "experience": 20,

        "education": 15,

        "certifications": 10,

        "contact": 15,

    }

    # -------------------------------------------------

    def analyze(

        self,

        resume: Resume,

        job: Job | None = None,

    ) -> dict:

        formatting = self.formatting_score(

            resume,

        )

        sections = self.section_score(

            resume,

        )

        keyword = self.keyword_score(

            resume,

            job,

        )

        action = self.action_verb_score(

            resume,

        )

        readability = self.readability_score(

            resume,

        )

        overall = round(

            formatting * 0.20

            + sections * 0.25

            + keyword * 0.25

            + action * 0.15

            + readability * 0.15,

            2,

        )

        resume.update_score(

            overall,

        )

        return {

            "overall_score": overall,

            "formatting_score": formatting,

            "section_score": sections,

            "keyword_score": keyword,

            "action_score": action,

            "readability_score": readability,

            "missing_keywords":

                self.missing_keywords(

                    resume,

                    job,

                ),

            "suggestions":

                self.suggestions(

                    resume,

                    job,

                ),

        }

    # -------------------------------------------------

    def formatting_score(

        self,

        resume: Resume,

    ) -> float:

        score = 100

        if not resume.full_name:

            score -= 10

        if not resume.email:

            score -= 15

        if not resume.phone:

            score -= 10

        if not resume.summary:

            score -= 10

        return max(score, 0)

    # -------------------------------------------------

    def section_score(

        self,

        resume: Resume,

    ) -> float:

        score = 0

        if resume.skills:

            score += self.SECTION_WEIGHTS["skills"]

        if resume.projects:

            score += self.SECTION_WEIGHTS["projects"]

        if resume.experience:

            score += self.SECTION_WEIGHTS["experience"]

        if resume.education:

            score += self.SECTION_WEIGHTS["education"]

        if resume.certifications:

            score += self.SECTION_WEIGHTS["certifications"]

        if resume.email and resume.phone:

            score += self.SECTION_WEIGHTS["contact"]

        return float(score)

    # -------------------------------------------------

    def keyword_score(

        self,

        resume: Resume,

        job: Job | None,

    ) -> float:

        if job is None:

            return 100.0

        required = {

            skill.lower()

            for skill

            in job.required_skills

        }

        if not required:

            return 100.0

        candidate = {

            skill.lower()

            for skill

            in resume.skills

        }

        matched = required.intersection(

            candidate,

        )

        return round(

            len(matched)

            / len(required)

            * 100,

            2,

        )

    # -------------------------------------------------

    def action_verb_score(

        self,

        resume: Resume,

    ) -> float:

        text = " ".join(

            [

                resume.summary,

                *[

                    str(project)

                    for project

                    in resume.projects

                ],

            ]

        ).lower()

        found = 0

        for verb in self.ACTION_VERBS:

            if re.search(

                rf"\b{re.escape(verb)}\b",

                text,

            ):

                found += 1

        return min(

            found * 10,

            100,

        )

    # -------------------------------------------------

    def readability_score(

        self,

        resume: Resume,

    ) -> float:

        words = len(

            resume.summary.split()

        )

        if words < 30:

            return 50

        if words < 80:

            return 75

        return 100

    # -------------------------------------------------

    def missing_keywords(

        self,

        resume: Resume,

        job: Job | None,

    ) -> list[str]:

        if job is None:

            return []

        resume_skills = {

            skill.lower()

            for skill

            in resume.skills

        }

        return [

            skill

            for skill

            in job.required_skills

            if skill.lower()

            not in resume_skills

        ]

    # -------------------------------------------------

    def suggestions(

        self,

        resume: Resume,

        job: Job | None,

    ) -> list[str]:

        suggestions = []

        if not resume.summary:

            suggestions.append(

                "Add a professional summary."

            )

        if len(resume.projects) < 2:

            suggestions.append(

                "Include more technical projects."

            )

        if not resume.certifications:

            suggestions.append(

                "Add relevant certifications."

            )

        if job:

            missing = self.missing_keywords(

                resume,

                job,

            )

            if missing:

                suggestions.append(

                    "Include relevant keywords: "

                    + ", ".join(missing[:10])

                )

        if resume.total_skills < 8:

            suggestions.append(

                "Expand your technical skill set."

            )

        return suggestions


ats_engine = ATSEngine()