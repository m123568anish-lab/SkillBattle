"""
=========================================================

SkillBattle

Certification Extractor

Extracts:

• Certification Names
• Issuing Organizations
• Certificate URLs
• Issue Dates
• Expiry Dates

=========================================================
"""

from __future__ import annotations

import re


class CertificationExtractor:

    CERTIFICATION_KEYWORDS = [

        "certificate",
        "certification",
        "certified",
        "credential",
        "badge",

    ]

    ORGANIZATIONS = [

        "google",
        "microsoft",
        "aws",
        "amazon",
        "oracle",
        "ibm",
        "meta",
        "cisco",
        "red hat",
        "coursera",
        "udemy",
        "nptel",
        "infosys",
        "salesforce",
        "huawei",

    ]

    URL_PATTERN = re.compile(

        r"https?://[^\s]+",

        re.IGNORECASE,

    )

    DATE_PATTERN = re.compile(

        r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"
        r"[a-z]*\s+\d{4}\b",

        re.IGNORECASE,

    )

    YEAR_PATTERN = re.compile(

        r"\b(19|20)\d{2}\b"

    )

    # --------------------------------------------------

    def extract(

        self,

        text: str,

    ) -> dict:

        return {

            "certifications": self.extract_certifications(text),

            "organizations": self.extract_organizations(text),

            "verification_links": self.extract_links(text),

            "dates": self.extract_dates(text),

        }

    # --------------------------------------------------

    def extract_certifications(

        self,

        text: str,

    ) -> list[str]:

        lines = [

            line.strip()

            for line in text.splitlines()

            if line.strip()

        ]

        found = []

        for line in lines:

            lower = line.lower()

            if any(

                keyword in lower

                for keyword in self.CERTIFICATION_KEYWORDS

            ):

                found.append(line)

        return list(dict.fromkeys(found))

    # --------------------------------------------------

    def extract_organizations(

        self,

        text: str,

    ) -> list[str]:

        lower = text.lower()

        found = []

        for org in self.ORGANIZATIONS:

            if org in lower:

                found.append(org.title())

        return sorted(set(found))

    # --------------------------------------------------

    def extract_links(

        self,

        text: str,

    ) -> list[str]:

        return self.URL_PATTERN.findall(text)

    # --------------------------------------------------

    def extract_dates(

        self,

        text: str,

    ) -> list[str]:

        dates = []

        dates.extend(

            self.DATE_PATTERN.findall(text)

        )

        for match in self.YEAR_PATTERN.finditer(text):

            dates.append(match.group())

        return sorted(set(dates))


certification_extractor = CertificationExtractor()