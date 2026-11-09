from __future__ import annotations

import re
import traceback
from typing import Any

from sqlalchemy.exc import DBAPIError


_SQL_URL = re.compile(
    r"(?i)\b(?:postgres(?:ql)?(?:\+\w+)?|sqlite(?:\+\w+)?)://[^\s,;]+"
)
_SQL_LITERAL = re.compile(r"'(?:''|\\.|[^'])*'")
_SENSITIVE_ASSIGNMENT = re.compile(
    r"(?i)\b(password|passwd|token|secret|api[_-]?key)\b"
    r"(\s*[:=]\s*)(?:'[^']*'|\"[^\"]*\"|[^\s,;]+)"
)
_SQLSTATE = re.compile(r"[0-9A-Z]{5}")
_MAX_STATEMENT_LENGTH = 2000


def redact_sql_statement(statement: object) -> str | None:
    if not isinstance(statement, str) or not statement:
        return None

    redacted = _SQL_URL.sub("[REDACTED_URL]", statement)
    redacted = _SENSITIVE_ASSIGNMENT.sub(r"\1\2[REDACTED]", redacted)
    redacted = _SQL_LITERAL.sub("'[REDACTED]'", redacted)
    if len(redacted) > _MAX_STATEMENT_LENGTH:
        redacted = redacted[:_MAX_STATEMENT_LENGTH] + "...[TRUNCATED]"
    return redacted


def database_error_diagnostics(exc: BaseException) -> dict[str, Any]:
    if not isinstance(exc, DBAPIError):
        return {
            "sqlalchemy_error_type": type(exc).__name__,
            "driver_error_type": None,
            "sqlstate": None,
            "statement": None,
        }

    original = exc.orig
    sqlstate = getattr(original, "sqlstate", None) or getattr(
        original, "pgcode", None
    )
    if not isinstance(sqlstate, str) or _SQLSTATE.fullmatch(sqlstate) is None:
        sqlstate = None

    return {
        "sqlalchemy_error_type": type(exc).__name__,
        "driver_error_type": type(original).__name__,
        "sqlstate": sqlstate,
        "statement": redact_sql_statement(exc.statement),
    }


def safe_traceback_frames(exc: BaseException) -> str:
    frames = traceback.extract_tb(exc.__traceback__)

    def basename(filename: str) -> str:
        return filename.replace("\\", "/").rsplit("/", 1)[-1]

    return " -> ".join(
        f"{basename(frame.filename)}:{frame.lineno}:{frame.name}"
        for frame in frames[-20:]
    )
