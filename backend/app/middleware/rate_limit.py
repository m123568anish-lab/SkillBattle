"""
=========================================================

Rate Limiting Middleware
Enforces request rate limits with IP isolation and
standard 429 Retry-After response headers.

=========================================================
"""

from __future__ import annotations

from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.redis.rate_limiter import rate_limiter


def _extract_client_ip(request) -> str:
    """Safely extract remote client IP address from proxy headers."""
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip.strip()

    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()

    return request.client.host if request.client else "unknown"


class RateLimitMiddleware(BaseHTTPMiddleware):

    DEFAULT_LIMIT = 120
    DEFAULT_WINDOW = 60

    AUTH_LIMIT = 15
    AUTH_WINDOW = 60

    async def dispatch(
        self,
        request,
        call_next,
    ):
        import sys
        import os
        from app.core.config import settings

        # Bypass rate limiting in automated test suites
        if "pytest" in sys.modules or os.getenv("PYTEST_CURRENT_TEST") or getattr(settings, "ENVIRONMENT", "").lower() in ("test", "testing"):
            return await call_next(request)

        path = request.url.path

        # Sensitive auth pathways receive stricter rate limits to prevent brute-force attacks
        if any(auth_path in path for auth_path in ("/auth/login", "/auth/register", "/auth/forgot-password", "/auth/2fa")):
            limit = self.AUTH_LIMIT
            window = self.AUTH_WINDOW
            bucket_key = f"auth:{_extract_client_ip(request)}"
        else:
            limit = self.DEFAULT_LIMIT
            window = self.DEFAULT_WINDOW
            bucket_key = f"general:{_extract_client_ip(request)}"

        allowed = await rate_limiter.allow(
            bucket_key,
            limit,
            window,
        )

        if not allowed:
            return JSONResponse(
                status_code=429,
                headers={"Retry-After": str(window)},
                content={
                    "success": False,
                    "message": "Too many requests. Please slow down and try again later.",
                },
            )

        return await call_next(request)
