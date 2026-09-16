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
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
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
        allow_origins=origins,
        allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|.*\.vercel\.app|.*\.onrender\.com)(:\d+)?",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=600,
    )