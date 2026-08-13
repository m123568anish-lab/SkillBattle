"""
=========================================================

SkillBattle

Education Extractor

Extracts educational qualifications
from resume text.

=========================================================
"""

from __future__ import annotations

import re


class EducationExtractor:

    """
    Resume Education Extractor
    """

    DEGREE_PATTERNS = [

        r"\bb\.?\s?tech\b",
        r"\bbachelor of technology\b",

        r"\bb\.?\s?e\b",
        r"\bbachelor of engineering\b",

        r"\bm\.?\s?tech\b",
        r"\bmaster of technology\b",

        r"\bbca\b",
        r"\bmca\b",

        r"\bbsc\b",
        r"\bmsc\b",

        r"\bbcom\b",
        r"\bmcom\b",

        r"\bphd\b",

        r"\bmba\b",

        r"\bdiploma\b",

    ]

    YEAR_PATTERN = re.compile(

        r"\b(19|20)\d{2}\b"

    )

    CGPA_PATTERN = re.compile(

        r"\b\d\.\d{1,2}\b"

    )

    PERCENT_PATTERN = re.compile(

        r"\b\d{2,3}(?:\.\d+)?%"

    )

    UNIVERSITY_KEYWORDS = [

        "university",

        "college",

        "institute",

        "school",

        "academy",

    ]

    # ----------------------------------------------------

    def extract(

        self,

        text: str,

    ) -> dict:

        lines = [

            line.strip()

            for line in text.splitlines()

            if line.strip()

        ]

        degrees = self.extract_degrees(text)

        years = self.extract_years(text)

        cgpa = self.extract_cgpa(text)

        percentage = self.extract_percentage(text)

        institutes = self.extract_institutes(lines)

        return {

            "degrees": degrees,

            "institutes": institutes,

            "graduation_years": years,

            "cgpa": cgpa,

            "percentage": percentage,

        }

    # ----------------------------------------------------

    def extract_degrees(

        self,

        text: str,

    ) -> list[str]:

        text = text.lower()

        found = []

        for pattern in self.DEGREE_PATTERNS:

            matches = re.findall(

                pattern,

                text,

            )

            found.extend(matches)

        return sorted(

            list(set(found))

        )

    # ----------------------------------------------------

    def extract_years(

        self,

        text: str,

    ) -> list[str]:

        years = self.YEAR_PATTERN.findall(text)

        matches = re.finditer(

            self.YEAR_PATTERN,

            text,

        )

        return sorted(

            {

                m.group(0)

                for m in matches

            }

        )

    # ----------------------------------------------------

    def extract_cgpa(

        self,

        text: str,

    ) -> list[str]:

        return sorted(

            set(

                self.CGPA_PATTERN.findall(

                    text,

                )

            )

        )

    # ----------------------------------------------------

    def extract_percentage(

        self,

        text: str,

    ) -> list[str]:

        return sorted(

            set(

                self.PERCENT_PATTERN.findall(

                    text,

                )

            )

        )

    # ----------------------------------------------------

    def extract_institutes(

        self,

        lines: list[str],

    ) -> list[str]:

        institutes = []

        for line in lines:

            lower = line.lower()

            if any(

                keyword in lower

                for keyword in self.UNIVERSITY_KEYWORDS

            ):

                institutes.append(line)

        return institutes


education_extractor = EducationExtractor()