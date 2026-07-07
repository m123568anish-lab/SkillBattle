"""
=========================================================

SkillBattle Career Platform

Personal Information Extractor

Extracts

- Name
- Email
- Phone
- LinkedIn
- GitHub
- Portfolio
- Location

=========================================================
"""

from __future__ import annotations

import re

from email_validator import validate_email
import phonenumbers


class PersonalExtractor:

    EMAIL_REGEX = re.compile(
        r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"
    )

    LINKEDIN_REGEX = re.compile(
        r"(https?://)?(www\.)?linkedin\.com/in/[A-Za-z0-9\-_]+",
        re.IGNORECASE,
    )

    GITHUB_REGEX = re.compile(
        r"(https?://)?(www\.)?github\.com/[A-Za-z0-9\-_]+",
        re.IGNORECASE,
    )

    PORTFOLIO_REGEX = re.compile(
        r"https?://[^\s]+",
        re.IGNORECASE,
    )

    NAME_REGEX = re.compile(
        r"^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}",
        re.MULTILINE,
    )

    # --------------------------------------------------

    def extract(
        self,
        text: str,
    ) -> dict:

        return {

            "name": self.name(text),

            "email": self.email(text),

            "phone": self.phone(text),

            "linkedin": self.linkedin(text),

            "github": self.github(text),

            "portfolio": self.portfolio(text),

            "location": self.location(text),

        }

    # --------------------------------------------------

    def name(
        self,
        text: str,
    ) -> str:

        match = self.NAME_REGEX.search(text)

        if match:

            return match.group().strip()

        return ""

    # --------------------------------------------------

    def email(
        self,
        text: str,
    ) -> str:

        match = self.EMAIL_REGEX.search(text)

        if not match:

            return ""

        try:

            email = validate_email(

                match.group(),

                check_deliverability=False,

            )

            return email.normalized

        except Exception:

            return ""

    # --------------------------------------------------

    def phone(
        self,
        text: str,
    ) -> str:

        for match in phonenumbers.PhoneNumberMatcher(

            text,

            "IN",

        ):

            return phonenumbers.format_number(

                match.number,

                phonenumbers.PhoneNumberFormat.E164,

            )

        return ""

    # --------------------------------------------------

    def linkedin(
        self,
        text: str,
    ) -> str:

        match = self.LINKEDIN_REGEX.search(text)

        if match:

            return match.group()

        return ""

    # --------------------------------------------------

    def github(
        self,
        text: str,
    ) -> str:

        match = self.GITHUB_REGEX.search(text)

        if match:

            return match.group()

        return ""

    # --------------------------------------------------

    def portfolio(
        self,
        text: str,
    ) -> str:

        urls = self.PORTFOLIO_REGEX.findall(text)

        for url in urls:

            url = url.lower()

            if "github" in url:

                continue

            if "linkedin" in url:

                continue

            return url

        return ""

    # --------------------------------------------------

    def location(
        self,
        text: str,
    ) -> str:

        cities = [

            "Delhi",

            "Noida",

            "Ghaziabad",

            "Gurgaon",

            "Mumbai",

            "Bangalore",

            "Hyderabad",

            "Chennai",

            "Pune",

            "Kolkata",

        ]

        lower = text.lower()

        for city in cities:

            if city.lower() in lower:

                return city

        return ""


personal_extractor = PersonalExtractor()