"""
=========================================================

SkillBattle

Application Configuration

=========================================================
"""

from __future__ import annotations

import logging
import os
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from functools import lru_cache
from pathlib import Path

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict

logger = logging.getLogger(__name__)


def normalize_async_database_url(url: str) -> str:
    """Convert libpq SSL options to parameters supported by asyncpg."""
    if not url.startswith("postgresql"):
        return url
    parts = urlsplit(url)
    query = []
    for key, value in parse_qsl(parts.query, keep_blank_values=True):
        if key == "channel_binding":
            continue
        if key == "sslmode":
            key, value = "ssl", value or "require"
        query.append((key, value))
    return urlunsplit(parts._replace(query=urlencode(query)))


class Settings(BaseSettings):
    REDIS_URL: str = "redis://localhost:6379/0"

    # --------------------------------------------------
    # App
    # --------------------------------------------------

    APP_NAME: str = "SkillBattle"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = Field(default="development")

    # --------------------------------------------------
    # Database
    # --------------------------------------------------

    DATABASE_TYPE: str = Field(default="sqlite")  # "sqlite" or "postgresql"
    DATABASE_URL: str = Field(default="sqlite:///./skillbattle.db", description="Primary DB URL")
    ASYNC_DATABASE_URL: str = Field(default="sqlite+aiosqlite:///./skillbattle.db", description="Async DB URL")

    # SQLite
    SQLITE_DATABASE_URL: str = "sqlite:///./skillbattle.db"
    SQLITE_ASYNC_DATABASE_URL: str = "sqlite+aiosqlite:///./skillbattle.db"
    # Postgres
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "skillbattle_db"
    POSTGRES_USER: str = "skillbattle"
    POSTGRES_PASSWORD: str = "skillbattle"
    # --------------------------------------------------
    # JWT
    # --------------------------------------------------

    SECRET_KEY: str = Field(default="CHANGE_ME")

    # --------------------------------------------------
    # CORS
    # --------------------------------------------------

    CORS_ORIGINS: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
            "https://localhost:3000",
            "https://127.0.0.1:3000",
        ]
    )
    ALLOWED_ORIGINS: str = Field(default="", description="Comma-separated allowed origins from environment")

    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # --------------------------------------------------
    # AI Providers
    # --------------------------------------------------

    OLLAMA_URL: str = "http://localhost:11434"

    OLLAMA_MODEL: str = "llama3.1:8b"

    GEMINI_API_KEY: str = ""

    OPENAI_API_KEY: str = ""

    ANTHROPIC_API_KEY: str = ""

    DEEPSEEK_API_KEY: str = ""

    # --------------------------------------------------
    # Uploads
    # --------------------------------------------------

    UPLOAD_DIR: str = "uploads"

    MAX_UPLOAD_SIZE: int = 20 * 1024 * 1024

    ALLOWED_EXTENSIONS: list[str] = [
        ".pdf",
        ".docx",
    ]

    # --------------------------------------------------
    # Development helpers
    # --------------------------------------------------

    # When True, the startup DB initializer will remove the existing
    # SQLite database file before creating tables. This is useful for
    # tests or one-off resets but dangerous in active development where
    # you want data to persist across restarts. Default: False.
    RESET_DB: bool = False

    # --------------------------------------------------

    model_config = SettingsConfigDict(
        # Production configuration must be supplied by the deployment
        # environment, not loaded from a local placeholder file.
        env_file=(".env.local", ".env"),
        case_sensitive=True,
        extra="ignore",
    )

    @property
    def effective_cors_origins(self) -> list[str]:
        """Return the CORS origin list, preferring env-driven ALLOWED_ORIGINS."""
        raw = self.ALLOWED_ORIGINS or os.getenv("ALLOWED_ORIGINS") or os.getenv("CORS_ORIGINS") or ""
        if raw:
            values = [origin.strip() for origin in raw.split(",") if origin.strip()]
            if values:
                return values
        return self.CORS_ORIGINS

    @model_validator(mode="after")
    def populate_database_urls(self):
        """Build default DB URLs from the DB type when environment values are not set.

        Prefer local SQLite when running locally in development/testing mode unless
        explicit valid production credentials are set for production environment.
        """
        import sys

        database_url = (self.DATABASE_URL or "").strip()
        async_database_url = (self.ASYNC_DATABASE_URL or "").strip()
        database_type = (self.DATABASE_TYPE or "").strip().lower()
        environment = (self.ENVIRONMENT or "").strip().lower()

        is_testing = "pytest" in sys.modules or bool(os.getenv("PYTEST_CURRENT_TEST"))
        is_placeholder_pg = (
            "ep-xxx" in database_url
            or "user:password" in database_url
            or "ep-xxx" in async_database_url
            or "******" in database_url
            or "******" in async_database_url
        )

        if environment == "production" and (
            not database_url
            or is_placeholder_pg
            or not database_url.startswith("postgresql")
        ):
            raise ValueError(
                "Production requires a real PostgreSQL DATABASE_URL. "
                "Configure DATABASE_URL and ASYNC_DATABASE_URL before starting the API."
            )

        # Override remote postgres placeholder/test defaults to prevent gaierror / connection failures
        if is_testing or is_placeholder_pg or environment in ("development", "dev", "test") or not os.getenv("DATABASE_URL"):
            self.DATABASE_TYPE = "sqlite"
            self.DATABASE_URL = self.SQLITE_DATABASE_URL
            self.ASYNC_DATABASE_URL = self.SQLITE_ASYNC_DATABASE_URL
            return self

        is_sqlite = database_url.startswith("sqlite") or async_database_url.startswith("sqlite") or database_type == "sqlite"
        is_postgres = database_url.startswith("postgresql") or async_database_url.startswith("postgresql") or database_type == "postgresql"

        if is_sqlite and not is_postgres:
            self.DATABASE_TYPE = "sqlite"
            if not database_url or database_url.startswith("postgresql"):
                self.DATABASE_URL = self.SQLITE_DATABASE_URL
            if not async_database_url or async_database_url.startswith("postgresql"):
                self.ASYNC_DATABASE_URL = self.SQLITE_ASYNC_DATABASE_URL
            return self

        self.DATABASE_TYPE = "postgresql"
        if database_url.startswith("sqlite") or not database_url:
            self.DATABASE_URL = (
                f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
                f"{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            )
        if async_database_url.startswith("sqlite") or not async_database_url:
            self.ASYNC_DATABASE_URL = self.DATABASE_URL.replace(
                "postgresql://", "postgresql+asyncpg://", 1
            )
        self.ASYNC_DATABASE_URL = normalize_async_database_url(
            self.ASYNC_DATABASE_URL
        )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()