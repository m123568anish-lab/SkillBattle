"""
=========================================================
SkillBattle Language Registry
=========================================================

Acts as the bridge between:

- Supported languages
- Installed toolchains

Nothing outside this file should directly inspect
language or toolchain metadata.

=========================================================
"""

from __future__ import annotations

from typing import Dict, List

from app.modules.compiler.config import (
    Language,
    Toolchain,
    SUPPORTED_LANGUAGES,
    TOOLCHAINS,
)


class LanguageRegistry:
    """
    Central registry for all programming languages.
    """

    def __init__(self):

        self._languages: Dict[str, Language] = (
            SUPPORTED_LANGUAGES
        )

        self._toolchains: Dict[str, Toolchain] = (
            TOOLCHAINS
        )

    # =====================================================
    # Language Lookup
    # =====================================================

    def get(
        self,
        language: str,
    ) -> Language:

        language = language.lower()

        if language not in self._languages:

            raise ValueError(
                f"Unsupported language: {language}"
            )

        return self._languages[language]

    # =====================================================
    # Toolchain Lookup
    # =====================================================

    def toolchain(
        self,
        language: str,
    ) -> Toolchain:

        language = language.lower()

        if language == "java":

            return self._toolchains["javac"]

        if language not in self._toolchains:

            raise ValueError(
                f"No toolchain registered for {language}"
            )

        return self._toolchains[language]

    # =====================================================
    # Availability
    # =====================================================

    def is_supported(
        self,
        language: str,
    ) -> bool:

        return language.lower() in self._languages

    def is_available(
        self,
        language: str,
    ) -> bool:

        try:

            return self.toolchain(
                language
            ).installed

        except Exception:

            return False

    # =====================================================
    # Lists
    # =====================================================

    def supported(self) -> List[Language]:

        return list(
            self._languages.values()
        )

    def available(self) -> List[Language]:

        languages = []

        for language in self._languages.values():

            if self.is_available(
                language.id
            ):

                languages.append(
                    language
                )

        return languages

    # =====================================================
    # Information
    # =====================================================

    def summary(self):

        return {

            "supported": len(
                self.supported()
            ),

            "available": len(
                self.available()
            ),

            "languages": [

                {

                    "id": language.id,

                    "name": language.name,

                    "installed": self.is_available(
                        language.id
                    ),

                }

                for language in self.supported()

            ],

        }


registry = LanguageRegistry()