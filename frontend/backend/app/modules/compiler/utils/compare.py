"""
=========================================================

Output Comparator

Production Version

=========================================================
"""

from __future__ import annotations


def normalize(text: str) -> str:

    lines = []

    for line in text.strip().splitlines():

        line = " ".join(line.split())

        lines.append(line)

    return "\n".join(lines)


def compare_output(
    expected: str,
    actual: str,
) -> bool:

    return normalize(expected) == normalize(actual)