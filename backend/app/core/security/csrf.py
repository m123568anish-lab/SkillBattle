"""
=========================================================

SkillBattle / Qubira — CSRF Protection Middleware
Defends against Cross-Site Request Forgery attacks for
cookie-based / ambient credential requests.

=========================================================
"""

from __future__ import annotations

from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Safe HTTP methods according to RFC 7231
_SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}

# Known session and authentication cookie names
_AUTH_COOKIES = {
    "session",
    "auth_token",
    "access_token",
    "refresh_token",
    "neon_auth",
    "sb_auth",
}

# Routes exempt from CSRF checks (e.g. webhooks, third-party callbacks)
_EXEMPT_ROUTES = (
    "/api/v1/webhooks",
    "/api/v1/auth/webhook",
    "/docs",
    "/redoc",
    "/openapi.json",
)


class CSRFMiddleware(BaseHTTPMiddleware):
    """
    CSRF Defense Middleware.
    When mutating requests (POST, PUT, PATCH, DELETE) carry ambient authentication cookies
    without an explicit Authorization: Bearer token header, require a matching or present
    X-CSRF-Token header to prevent forged cross-origin requests.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.method in _SAFE_METHODS:
            return await call_next(request)

        path = request.url.path
        if any(path.startswith(prefix) for prefix in _EXEMPT_ROUTES):
            return await call_next(request)

        # If the request uses explicit Bearer token authorization, CSRF protection is not needed
        # because browsers never automatically attach custom Authorization headers.
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            return await call_next(request)

        # Check if any authentication or session cookies are present
        has_auth_cookie = any(cookie_name in request.cookies for cookie_name in _AUTH_COOKIES)

        if has_auth_cookie:
            csrf_token = request.headers.get("X-CSRF-Token")
            cookie_csrf = request.cookies.get("csrf_token")

            # Double submit cookie or header check
            if not csrf_token and not cookie_csrf:
                return JSONResponse(
                    status_code=403,
                    content={
                        "success": False,
                        "message": "CSRF validation failed: Missing CSRF token for cookie-authenticated request.",
                    },
                )

            if cookie_csrf and csrf_token and cookie_csrf != csrf_token:
                return JSONResponse(
                    status_code=403,
                    content={
                        "success": False,
                        "message": "CSRF validation failed: Token mismatch.",
                    },
                )

        return await call_next(request)
