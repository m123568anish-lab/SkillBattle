"""
CORS Middleware — strict production origin allowlist.
"""
import logging
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger(__name__)

# Explicit production origins. Set ALLOWED_ORIGINS env var on Render/Vercel
# as comma-separated list to override in each environment.
_BUILTIN_ORIGINS: list[str] = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "https://skill-battle-one.vercel.app",
    "https://skill-battle-z2fa.vercel.app",
    "https://skill-battle.vercel.app",
]


def configure_cors(app) -> None:
    from app.core.config import settings

    env_origins = settings.effective_cors_origins
    if isinstance(env_origins, str):
        env_origins = [o.strip() for o in env_origins.split(",") if o.strip()]

    origins = list({*_BUILTIN_ORIGINS, *env_origins})
    logger.info("CORS allow_origins configured: %s", origins)

    app.add_middleware(
        CORSMiddleware,
        # Explicit list — no wildcard "*" or open regexes in production.
        allow_origins=origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
        expose_headers=["X-Request-ID"],
        max_age=600,
    )