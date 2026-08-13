"""
=========================================================

SkillBattle

Resume Text Cleaner

Cleans extracted resume text before AI processing.

=========================================================
"""

from __future__ import annotations

import re
import unicodedata


class TextCleaner:

    """
    Utility class for cleaning extracted resume text.
    """

    # --------------------------------------------------
    # Main Pipeline
    # --------------------------------------------------

    def clean(
        self,
        text: str,
    ) -> str:

        text = self.normalize_unicode(text)

        text = self.remove_non_printable(text)

        text = self.normalize_whitespace(text)

        text = self.normalize_bullets(text)

        text = self.remove_duplicate_blank_lines(text)

        text = self.strip_lines(text)

        return text.strip()

    # --------------------------------------------------
    # Unicode
    # --------------------------------------------------

    def normalize_unicode(
        self,
        text: str,
    ) -> str:

        return unicodedata.normalize(
            "NFKC",
            text,
        )

    # --------------------------------------------------
    # Remove Invisible Characters
    # --------------------------------------------------

    def remove_non_printable(
        self,
        text: str,
    ) -> str:

        return "".join(

            char

            for char in text

            if char.isprintable()

            or char in ("\n", "\t")

        )

    # --------------------------------------------------
    # Spaces
    # --------------------------------------------------

    def normalize_whitespace(
        self,
        text: str,
    ) -> str:

        text = text.replace("\r\n", "\n")

        text = text.replace("\r", "\n")

        text = re.sub(

            r"[ \t]+",

            " ",

            text,

        )

        return text

    # --------------------------------------------------
    # Bullet Symbols
    # --------------------------------------------------

    def normalize_bullets(
        self,
        text: str,
    ) -> str:

        bullets = [

            "•",

            "●",

            "▪",

            "◦",

            "■",

            "►",

            "➤",

            "✓",

            "✔",

            "★",

        ]

        for bullet in bullets:

            text = text.replace(

                bullet,

                "-",

            )

        return text

    # --------------------------------------------------
    # Blank Lines
    # --------------------------------------------------

    def remove_duplicate_blank_lines(
        self,
        text: str,
    ) -> str:

        return re.sub(

            r"\n{3,}",

            "\n\n",

            text,

        )

    # --------------------------------------------------
    # Strip Each Line
    # --------------------------------------------------

    def strip_lines(
        self,
        text: str,
    ) -> str:

        return "\n".join(

            line.strip()

            for line in text.splitlines()

        )

    # --------------------------------------------------
    # Token Count
    # --------------------------------------------------

    def word_count(
        self,
        text: str,
    ) -> int:

        return len(text.split())

    # --------------------------------------------------
    # Character Count
    # --------------------------------------------------

    def character_count(
        self,
        text: str,
    ) -> int:

        return len(text)


text_cleaner = TextCleaner()