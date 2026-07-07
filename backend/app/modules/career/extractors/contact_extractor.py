"""
=========================================================

SkillBattle

Contact Information Extractor

Extracts:

• Name
• Email
• Phone
• LinkedIn
• GitHub
• Portfolio Website

=========================================================
"""

from __future__ import annotations

import re


class ContactExtractor:

    EMAIL_PATTERN = re.compile(
        r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
    )

    PHONE_PATTERN = re.compile(
        r"(?:\+?\d{1,3}[- ]?)?(?:\(?\d{3,5}\)?[- ]?)?\d{3,5}[- ]?\d{4,6}"
    )

    LINKEDIN_PATTERN = re.compile(
        r"https?://(?:www\.)?linkedin\.com/[^\s]+",
        re.IGNORECASE,
    )

    GITHUB_PATTERN = re.compile(
        r"https?://(?:www\.)?github\.com/[^\s]+",
        re.IGNORECASE,
    )

    WEBSITE_PATTERN = re.compile(
        r"https?://[^\s]+",
        re.IGNORECASE,
    )

    # --------------------------------------------------

    def extract(self, text: str) -> dict:

        return {

            "name": self.extract_name(text),

            "email": self.extract_email(text),

            "phone": self.extract_phone(text),

            "linkedin": self.extract_linkedin(text),

            "github": self.extract_github(text),

            "portfolio": self.extract_portfolio(text),

        }

    # --------------------------------------------------

    def extract_name(self, text: str) -> str | None:

        lines = [

            line.strip()

            for line in text.splitlines()

            if line.strip()

        ]

        if not lines:

            return None

        candidate = lines[0]

        if len(candidate.split()) <= 5:

            return candidate

        return None

    # --------------------------------------------------

    def extract_email(self, text: str) -> str | None:

        match = self.EMAIL_PATTERN.search(text)

        return match.group(0) if match else None

    # --------------------------------------------------

    def extract_phone(self, text: str) -> str | None:

        match = self.PHONE_PATTERN.search(text)

        return match.group(0) if match else None

    # --------------------------------------------------

    def extract_linkedin(self, text: str) -> str | None:

        match = self.LINKEDIN_PATTERN.search(text)

        return match.group(0) if match else None

    # --------------------------------------------------

    def extract_github(self, text: str) -> str | None:

        match = self.GITHUB_PATTERN.search(text)

        return match.group(0) if match else None

    # --------------------------------------------------

    def extract_portfolio(self, text: str) -> str | None:

        websites = self.WEBSITE_PATTERN.findall(text)

        if not websites:

            return None

        for site in websites:

            lower = site.lower()

            if "linkedin" in lower:

                continue

            if "github" in lower:

                continue

            return site

        return None


contact_extractor = ContactExtractor()