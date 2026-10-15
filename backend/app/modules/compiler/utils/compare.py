"""
=========================================================

Output Comparator

Production Version

=========================================================
"""

from __future__ import annotations


import json
import re


def normalize(text: str) -> str:

    lines = []

    for line in (text or "").strip().splitlines():

        line = " ".join(line.split())

        lines.append(line)

    return "\n".join(lines)


def compare_output(
    expected: str,
    actual: str,
) -> bool:
    norm_exp = normalize(expected)
    norm_act = normalize(actual)

    if norm_exp == norm_act:
        return True

    # Case-insensitive booleans or nulls (True vs true, None vs null)
    if norm_exp.lower() == norm_act.lower() and norm_exp.lower() in ("true", "false", "none", "null"):
        return True

    # JSON structure equality
    try:
        if json.loads(norm_exp) == json.loads(norm_act):
            return True
    except Exception:
        pass

    # Sequence of numbers (e.g. "[0, 1]" vs "0 1" or "[0,1]")
    digits_exp = re.findall(r"-?\d+", norm_exp)
    digits_act = re.findall(r"-?\d+", norm_act)
    if digits_exp and digits_exp == digits_act and not re.search(r"[a-zA-Z]", norm_exp) and not re.search(r"[a-zA-Z]", norm_act):
        return True

    return False