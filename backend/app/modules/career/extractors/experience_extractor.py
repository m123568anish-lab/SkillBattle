"""
=========================================================

SkillBattle

Experience Extractor

Extracts:

• Companies
• Job Titles
• Internships
• Employment Duration
• Total Experience

=========================================================
"""

from __future__ import annotations

import re
from datetime import datetime


class ExperienceExtractor:

    """
    Resume Experience Extractor
    """

    JOB_TITLES = [

        "software engineer",
        "software developer",
        "backend developer",
        "frontend developer",
        "full stack developer",
        "python developer",
        "java developer",
        "data scientist",
        "data analyst",
        "machine learning engineer",
        "ai engineer",
        "deep learning engineer",
        "devops engineer",
        "cloud engineer",
        "mobile developer",
        "android developer",
        "ios developer",
        "web developer",
        "intern",
        "research intern",
        "software intern",
        "ai intern",
        "ml intern",
        "student",
        "freelancer",
        "consultant",

    ]

    MONTHS = [

        "jan", "january",
        "feb", "february",
        "mar", "march",
        "apr", "april",
        "may",
        "jun", "june",
        "jul", "july",
        "aug", "august",
        "sep", "sept", "september",
        "oct", "october",
        "nov", "november",
        "dec", "december",

    ]

    YEAR_PATTERN = re.compile(r"\b(19|20)\d{2}\b")

    # ----------------------------------------------------

    def extract(

        self,

        text: str,

    ) -> dict:

        return {

            "job_titles": self.extract_job_titles(text),

            "companies": self.extract_companies(text),

            "internships": self.extract_internships(text),

            "years": self.extract_years(text),

            "estimated_experience": self.calculate_experience(text),

        }

    # ----------------------------------------------------

    def extract_job_titles(

        self,

        text: str,

    ) -> list[str]:

        lower = text.lower()

        found = []

        for title in self.JOB_TITLES:

            if title in lower:

                found.append(title)

        return sorted(set(found))

    # ----------------------------------------------------

    def extract_companies(

        self,

        text: str,

    ) -> list[str]:

        companies = []

        lines = text.splitlines()

        keywords = [

            "technologies",
            "solutions",
            "systems",
            "software",
            "labs",
            "private limited",
            "pvt ltd",
            "inc",
            "corp",
            "company",

        ]

        for line in lines:

            line = line.strip()

            lower = line.lower()

            if any(k in lower for k in keywords):

                companies.append(line)

        return sorted(set(companies))

    # ----------------------------------------------------

    def extract_internships(

        self,

        text: str,

    ) -> list[str]:

        internships = []

        lines = text.splitlines()

        for line in lines:

            if "intern" in line.lower():

                internships.append(line.strip())

        return internships

    # ----------------------------------------------------

    def extract_years(

        self,

        text: str,

    ) -> list[int]:

        return [

            int(match.group())

            for match in self.YEAR_PATTERN.finditer(text)

        ]

    # ----------------------------------------------------

    def calculate_experience(

        self,

        text: str,

    ) -> float:

        years = self.extract_years(text)

        if len(years) < 2:

            return 0.0

        start = min(years)

        end = max(years)

        current_year = datetime.now().year

        if end > current_year:

            end = current_year

        experience = max(0, end - start)

        return round(float(experience), 1)


experience_extractor = ExperienceExtractor()