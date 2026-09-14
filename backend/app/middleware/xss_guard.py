"""
=========================================================

SkillBattle — XSS / Injection Guard Middleware

Lightweight ASGI middleware that inspects JSON request bodies
for common XSS and SQL injection payload patterns before they
ever reach a route handler.  This is a defence-in-depth layer;
Pydantic validators remain the primary schema guard.

Rejected payloads → HTTP 400 with a generic error message.
No stack traces or internal details are surfaced to the client.

=========================================================
"""

from __future__ import annotations

import json
import logging
import re
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Patterns to reject outright.  These are conservative regexes that catch
# the most common attack vectors without generating false positives on
# legitimate user content.
# ---------------------------------------------------------------------------
_BLOCKED_PATTERNS: list[re.Pattern[str]] = [
    # XSS — script/event-handler injection
    re.compile(r"<\s*script[\s>]", re.IGNORECASE),
    re.compile(r"javascript\s*:", re.IGNORECASE),
    re.compile(r"on\w+\s*=\s*[\"']", re.IGNORECASE),           # onerror=, onclick=, etc.
    re.compile(r"<\s*iframe[\s>]", re.IGNORECASE),
    re.compile(r"<\s*img[^>]+src\s*=\s*[\"']?\s*javascript", re.IGNORECASE),
    # SQL injection patterns
    re.compile(r"('\s*(OR|AND)\s*'?\d)", re.IGNORECASE),       # ' OR '1
    re.compile(r"--\s*(;|$)", re.MULTILINE),                   # SQL comment terminators
    re.compile(r"\bUNION\b.{0,40}\bSELECT\b", re.IGNORECASE), # UNION SELECT
    re.compile(r"\bDROP\s+TABLE\b", re.IGNORECASE),
    re.compile(r"\bEXEC\s*\(", re.IGNORECASE),
    re.compile(r"\bINSERT\s+INTO\b", re.IGNORECASE),
    # Path traversal
    re.compile(r"\.\./", re.IGNORECASE),
]

# Endpoints that accept binary/multipart bodies — skip JSON body inspection.
_SKIP_PREFIXES: tuple[str, ...] = (
    "/api/v1/uploads",
    "/docs",
    "/redoc",
    "/openapi",
    "/health",
    "/ready",
    "/healthz",
    "/metrics",
)

# Maximum body size to inspect (16 KB). Larger bodies are passed through
# without scanning to avoid DoS on bulk uploads.
_MAX_INSPECT_BYTES = 16_384


def _matches_any(text: str) -> re.Pattern[str] | None:
    """Return the first matching pattern, or None if clean."""
    for pattern in _BLOCKED_PATTERNS:
        if pattern.search(text):
            return pattern
    return None


class XSSGuardMiddleware(BaseHTTPMiddleware):
    """Reject requests containing XSS or SQL injection payloads."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Only inspect JSON bodies on mutating methods.
        if request.method not in {"POST", "PUT", "PATCH"}:
            return await call_next(request)

        path = request.url.path
        if any(path.startswith(prefix) for prefix in _SKIP_PREFIXES):
            return await call_next(request)

        content_type = request.headers.get("content-type", "")
        if "application/json" not in content_type:
            return await call_next(request)

        # Read and cache the body so downstream handlers can still consume it.
        body_bytes = await request.body()

        if len(body_bytes) > _MAX_INSPECT_BYTES:
            # Too large to scan — pass through; Pydantic will validate types.
            return await call_next(request)

        if body_bytes:
            try:
                body_str = body_bytes.decode("utf-8", errors="replace")
                matched = _matches_any(body_str)
                if matched:
                    logger.warning(
                        "XSSGuard blocked request: method=%s path=%s pattern=%s ip=%s",
                        request.method,
                        path,
                        matched.pattern,
                        request.client.host if request.client else "unknown",
                    )
                    return JSONResponse(
                        status_code=400,
                        content={
                            "success": False,
                            "message": "Request contains disallowed content.",
                        },
                    )
            except (UnicodeDecodeError, json.JSONDecodeError):
                # Non-UTF-8 or malformed JSON — let Pydantic handle it.
                pass

        return await call_next(request)
