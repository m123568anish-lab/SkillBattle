"""
=========================================================

SkillBattle

Project Extractor

Extracts:

• Project Names
• Technologies
• GitHub Links
• Live URLs
• Project Categories

=========================================================
"""

from __future__ import annotations

import re


class ProjectExtractor:

    """
    Resume Project Extractor
    """

    GITHUB_PATTERN = re.compile(
        r"https?://(?:www\.)?github\.com/[^\s]+",
        re.IGNORECASE,
    )

    URL_PATTERN = re.compile(
        r"https?://[^\s]+",
        re.IGNORECASE,
    )

    TECHNOLOGIES = {

        "python",
        "java",
        "c++",
        "javascript",
        "typescript",
        "react",
        "next.js",
        "nextjs",
        "fastapi",
        "flask",
        "django",
        "node.js",
        "express",
        "mongodb",
        "mysql",
        "postgresql",
        "firebase",
        "docker",
        "tensorflow",
        "keras",
        "pytorch",
        "opencv",
        "langchain",
        "ollama",
        "llama",
        "html",
        "css",
        "tailwind",
        "bootstrap",
    }

    AI_KEYWORDS = {

        "ai",
        "artificial intelligence",
        "machine learning",
        "deep learning",
        "nlp",
        "computer vision",
        "rag",
        "llm",
        "chatbot",
    }

    WEB_KEYWORDS = {

        "website",
        "web",
        "dashboard",
        "frontend",
        "backend",
        "full stack",
    }

    MOBILE_KEYWORDS = {

        "android",
        "ios",
        "flutter",
        "react native",
    }

    # --------------------------------------------------

    def extract(

        self,

        text: str,

    ) -> dict:

        return {

            "projects": self.extract_project_titles(text),

            "technologies": self.extract_technologies(text),

            "github": self.extract_github(text),

            "live_demo": self.extract_live_links(text),

            "categories": self.detect_categories(text),

        }

    # --------------------------------------------------

    def extract_project_titles(

        self,

        text: str,

    ) -> list[str]:

        titles = []

        lines = [

            line.strip()

            for line in text.splitlines()

            if line.strip()

        ]

        project_keywords = [

            "project",

            "developed",

            "built",

            "created",

        ]

        for line in lines:

            lower = line.lower()

            if any(keyword in lower for keyword in project_keywords):

                titles.append(line)

        return list(dict.fromkeys(titles))

    # --------------------------------------------------

    def extract_technologies(

        self,

        text: str,

    ) -> list[str]:

        lower = text.lower()

        found = []

        for tech in self.TECHNOLOGIES:

            if re.search(

                r"\b" + re.escape(tech) + r"\b",

                lower,

            ):

                found.append(tech)

        return sorted(set(found))

    # --------------------------------------------------

    def extract_github(

        self,

        text: str,

    ) -> list[str]:

        return self.GITHUB_PATTERN.findall(text)

    # --------------------------------------------------

    def extract_live_links(

        self,

        text: str,

    ) -> list[str]:

        urls = []

        for url in self.URL_PATTERN.findall(text):

            lower = url.lower()

            if "github" in lower:

                continue

            if "linkedin" in lower:

                continue

            urls.append(url)

        return list(dict.fromkeys(urls))

    # --------------------------------------------------

    def detect_categories(

        self,

        text: str,

    ) -> list[str]:

        lower = text.lower()

        categories = []

        if any(word in lower for word in self.AI_KEYWORDS):

            categories.append("AI/ML")

        if any(word in lower for word in self.WEB_KEYWORDS):

            categories.append("Web Development")

        if any(word in lower for word in self.MOBILE_KEYWORDS):

            categories.append("Mobile Development")

        return categories


project_extractor = ProjectExtractor()