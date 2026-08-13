"""
=========================================================
SkillBattle Compiler Configuration
=========================================================

Central configuration package for the compiler module.

This package exposes:

- Supported programming languages
- Installed toolchains
- Compiler configuration

Nothing outside the compiler module should access
toolchain information directly.

=========================================================
"""

from .languages import (
    Language,
    SUPPORTED_LANGUAGES,
    get_language,
)

from .toolchains import (
    Toolchain,
    TOOLCHAINS,
    detect_toolchains,
)

__all__ = [
    "Language",
    "SUPPORTED_LANGUAGES",
    "Toolchain",
    "TOOLCHAINS",
    "detect_toolchains",
    "get_language",
]