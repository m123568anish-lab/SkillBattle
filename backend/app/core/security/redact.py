"""
=========================================================
SkillBattle / Qubira — Log Redaction & Security Masking
Strips and masks credentials, tokens, secrets, passwords,
and sensitive connection strings from application logs.
=========================================================
"""

from __future__ import annotations

import logging
import re
from typing import Any, Mapping

# Regular expressions matching sensitive keys and values in log messages
_SENSITIVE_PATTERNS = [
    # JWT structure: eyJ... . eyJ... . ...
    (re.compile(r"eyJ[A-Za-z0-9\-_]{10,}\.eyJ[A-Za-z0-9\-_]{10,}\.[A-Za-z0-9\-_]{10,}", re.IGNORECASE), r"[REDACTED_JWT]"),
    # Authorization header / Bearer tokens
    (re.compile(r"(Bearer\s+)[A-Za-z0-9\-_\.]+", re.IGNORECASE), r"\1[REDACTED_TOKEN]"),
    # Passwords in URLs (postgres, redis, etc.): e.g. postgresql://user:pass@host/db
    (re.compile(r"(://[^:\s]+:)[^@\s]+(@)", re.IGNORECASE), r"\1[REDACTED_PASSWORD]\2"),
    # JSON / Key-value password fields
    (re.compile(r'("(?:password|secret|token|api_key|access_token|refresh_token)"\s*:\s*")[^"]+(")', re.IGNORECASE), r'\1[REDACTED]\2'),
    # Plain text key=value pairs in logs (do not re-redact already redacted tokens)
    (re.compile(r'(password|secret|api_key|token|access_token)=(?!\[REDACTED)([^\s&]+)', re.IGNORECASE), r'\1=[REDACTED]'),
]

_SENSITIVE_KEYS = {
    "password",
    "password_hash",
    "hashed_password",
    "secret",
    "secret_key",
    "api_key",
    "token",
    "access_token",
    "refresh_token",
    "two_factor_secret",
    "database_url",
    "async_database_url",
    "redis_url",
    "sentry_dsn",
}


def redact_sensitive_text(text: str) -> str:
    """Mask credentials and secrets within free-form text or log lines."""
    if not text:
        return text
    result = text
    for pattern, replacement in _SENSITIVE_PATTERNS:
        result = pattern.sub(replacement, result)
    return result


def redact_sensitive_dict(data: Mapping[str, Any]) -> dict[str, Any]:
    """Recursively mask sensitive values in dictionaries before logging or serialization."""
    sanitized: dict[str, Any] = {}
    for key, value in data.items():
        if key.lower() in _SENSITIVE_KEYS:
            sanitized[key] = "[REDACTED]"
        elif isinstance(value, dict):
            sanitized[key] = redact_sensitive_dict(value)
        elif isinstance(value, list):
            sanitized[key] = [
                redact_sensitive_dict(item) if isinstance(item, dict) else item
                for item in value
            ]
        elif isinstance(value, str):
            sanitized[key] = redact_sensitive_text(value)
        else:
            sanitized[key] = value
    return sanitized


class RedactingFormatter(logging.Formatter):
    """Logging Formatter that strips sensitive information from all log outputs."""

    def format(self, record: logging.LogRecord) -> str:
        original = super().format(record)
        return redact_sensitive_text(original)
