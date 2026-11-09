from __future__ import annotations

import re
from typing import Any

from sqlalchemy import and_, func, not_, or_

from app.models.problem import Problem

_INTERNAL_TITLE_PATTERNS = (
    re.compile(r"^catalog\s+page\s+[0-9a-f]{8}\s+\d+$", re.IGNORECASE),
    re.compile(r"^daily\s+arrays\s+[0-9a-f]{8}$", re.IGNORECASE),
    re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.IGNORECASE),
    re.compile(r"^.+\.(?:json|csv|txt)$", re.IGNORECASE),
    re.compile(r"^(?:coding\s+)?problem\s+\d+$", re.IGNORECASE),
)

_PLACEHOLDER_STATEMENTS = {
    "",
    "return the requested value.",
    "return a value.",
    "solve the problem.",
    "todo",
    "tbd",
}


def _title_is_internal(title: str | None) -> bool:
    normalized = (title or "").strip()
    return not normalized or any(pattern.fullmatch(normalized) for pattern in _INTERNAL_TITLE_PATTERNS)


def _statement_is_placeholder(description: str | None) -> bool:
    return (description or "").strip().casefold() in _PLACEHOLDER_STATEMENTS


def problem_can_be_solved(problem: Any) -> bool:
    return not _title_is_internal(getattr(problem, "title", None)) and not _statement_is_placeholder(
        getattr(problem, "description", None)
    )


def problem_metadata(problem: Any) -> dict[str, Any]:
    title_is_internal = _title_is_internal(getattr(problem, "title", None))
    statement_is_placeholder = _statement_is_placeholder(getattr(problem, "description", None))
    warnings = []

    if title_is_internal:
        warnings.append("The title is missing or is an internal import label.")
    if statement_is_placeholder:
        warnings.append("The problem statement is placeholder content.")
    if not getattr(problem, "tags", []):
        warnings.append("No verified topic tags are recorded.")
    if title_is_internal or statement_is_placeholder:
        warnings.append("Stored category and difficulty cannot be verified against a complete problem.")

    can_solve = not title_is_internal and not statement_is_placeholder
    return {
        "title": getattr(problem, "title", None) if can_solve else None,
        "metadata_status": "needs_repair" if warnings else "ready",
        "metadata_warnings": warnings,
        "can_solve": can_solve,
    }


def problem_can_be_solved_clause():
    title = func.lower(func.trim(Problem.title))
    description = func.lower(func.trim(Problem.description))
    numeric_title_suffix = func.trim(func.substr(title, 9))
    numeric_coding_title_suffix = func.trim(func.substr(title, 16))
    numeric_title_suffix_remainder = numeric_title_suffix
    numeric_coding_title_suffix_remainder = numeric_coding_title_suffix
    for digit in "0123456789":
        numeric_title_suffix_remainder = func.replace(numeric_title_suffix_remainder, digit, "")
        numeric_coding_title_suffix_remainder = func.replace(numeric_coding_title_suffix_remainder, digit, "")

    catalog_id_remainder = func.substr(title, 14, 8)
    for character in "0123456789abcdef":
        catalog_id_remainder = func.replace(catalog_id_remainder, character, "")

    catalog_index_remainder = func.trim(func.substr(title, 23))
    for digit in "0123456789":
        catalog_index_remainder = func.replace(catalog_index_remainder, digit, "")

    daily_arrays_id_remainder = func.substr(title, 14)
    for character in "0123456789abcdef":
        daily_arrays_id_remainder = func.replace(daily_arrays_id_remainder, character, "")

    uuid_remainder = title
    for character in "0123456789abcdef-":
        uuid_remainder = func.replace(uuid_remainder, character, "")

    title_is_internal = or_(
        Problem.title.is_(None),
        title == "",
        and_(
            title.like("catalog page %"),
            func.substr(title, 22, 1) == " ",
            catalog_id_remainder == "",
            func.trim(func.substr(title, 23)) != "",
            catalog_index_remainder == "",
        ),
        and_(
            title.like("daily arrays %"),
            func.length(title) == 21,
            daily_arrays_id_remainder == "",
        ),
        and_(
            title.like("coding problem %"),
            numeric_coding_title_suffix != "",
            numeric_coding_title_suffix_remainder == "",
        ),
        and_(
            title.like("problem %"),
            numeric_title_suffix != "",
            numeric_title_suffix_remainder == "",
        ),
        title.like("%.json"),
        title.like("%.csv"),
        title.like("%.txt"),
        and_(
            func.length(title) == 36,
            title.like("________-____-____-____-____________"),
            uuid_remainder == "",
        ),
    )
    statement_is_placeholder = description.in_(tuple(_PLACEHOLDER_STATEMENTS))
    return and_(not_(title_is_internal), not_(statement_is_placeholder))
