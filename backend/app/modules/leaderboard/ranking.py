"""
=========================================================

SkillBattle

Ranking Utilities

=========================================================
"""

from __future__ import annotations


def calculate_rank(entries):

    entries = sorted(

        entries,

        key=lambda item: item["xp"],

        reverse=True,

    )

    for index, entry in enumerate(entries, start=1):

        entry["rank"] = index

    return entries