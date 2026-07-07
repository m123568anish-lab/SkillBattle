"""
=========================================================

SkillBattle

Skills Extractor

Extracts technical and soft skills from resumes.

=========================================================
"""

from __future__ import annotations

import re


class SkillsExtractor:

    """
    Resume Skills Extractor
    """

    SKILL_DATABASE = {

        # ----------------------------------------
        # Programming Languages
        # ----------------------------------------

        "Programming": {

            "python",
            "java",
            "c",
            "c++",
            "c#",
            "javascript",
            "typescript",
            "go",
            "rust",
            "kotlin",
            "swift",
            "php",
            "ruby",
            "scala",
            "r",
            "matlab",
            "dart",

        },

        # ----------------------------------------
        # AI / ML
        # ----------------------------------------

        "AI/ML": {

            "tensorflow",
            "keras",
            "pytorch",
            "opencv",
            "scikit-learn",
            "xgboost",
            "lightgbm",
            "huggingface",
            "langchain",
            "llama",
            "ollama",
            "machine learning",
            "deep learning",
            "nlp",
            "computer vision",
            "generative ai",
            "rag",
            "transformers",

        },

        # ----------------------------------------
        # Web
        # ----------------------------------------

        "Web": {

            "html",
            "css",
            "tailwind",
            "bootstrap",
            "react",
            "next.js",
            "nextjs",
            "vue",
            "angular",
            "fastapi",
            "flask",
            "django",
            "node.js",
            "express",

        },

        # ----------------------------------------
        # Database
        # ----------------------------------------

        "Database": {

            "mysql",
            "postgresql",
            "sqlite",
            "mongodb",
            "redis",
            "oracle",
            "firebase",

        },

        # ----------------------------------------
        # Cloud
        # ----------------------------------------

        "Cloud": {

            "aws",
            "azure",
            "gcp",
            "docker",
            "kubernetes",
            "terraform",
            "jenkins",

        },

        # ----------------------------------------
        # Tools
        # ----------------------------------------

        "Tools": {

            "git",
            "github",
            "gitlab",
            "linux",
            "postman",
            "jira",
            "figma",
            "vscode",
            "visual studio",

        },

        # ----------------------------------------
        # Soft Skills
        # ----------------------------------------

        "Soft Skills": {

            "leadership",
            "communication",
            "problem solving",
            "critical thinking",
            "teamwork",
            "adaptability",
            "time management",
            "creativity",

        }

    }

    # =====================================================

    def extract(

        self,

        text: str,

    ) -> dict:

        text = text.lower()

        found = {}

        all_skills = []

        for category, skills in self.SKILL_DATABASE.items():

            matched = []

            for skill in skills:

                pattern = r"\b" + re.escape(skill) + r"\b"

                if re.search(pattern, text):

                    matched.append(skill)

            matched = sorted(set(matched))

            found[category] = matched

            all_skills.extend(matched)

        return {

            "categories": found,

            "skills": sorted(set(all_skills)),

            "total": len(set(all_skills)),

        }

    # =====================================================

    def has_skill(

        self,

        text: str,

        skill: str,

    ) -> bool:

        pattern = r"\b" + re.escape(skill.lower()) + r"\b"

        return bool(

            re.search(

                pattern,

                text.lower(),

            )

        )


skills_extractor = SkillsExtractor()