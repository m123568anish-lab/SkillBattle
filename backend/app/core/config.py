"""
=========================================================

SkillBattle

Application Configuration

=========================================================
"""

from __future__ import annotations

import logging
import os
from functools import lru_cache
from pathlib import Path

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict

logger = logging.getLogger(__name__)


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

    CORS_ORIGINS: str = Field(
        default=(
            "http://localhost:3000,http://127.0.0.1:3000,"
            "http://localhost:3001,http://127.0.0.1:3001,"
            "https://localhost:3000,https://127.0.0.1:3000"
        )
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
        env_file=(".env", ".env.production"),
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
        """Build default DB URLs from the DB type when environment values are not set."""
        if self.ENVIRONMENT.lower() == "production":
            prod_file = Path(__file__).resolve().parents[2] / ".env.production"
            if prod_file.exists():
                for line in prod_file.read_text(encoding="utf-8").splitlines():
                    if not line or line.strip().startswith("#") or "=" not in line:
                        continue
                    key, value = line.split("=", 1)
                    key = key.strip()
                    value = value.strip()
                    if key == "DATABASE_URL" and value:
                        self.DATABASE_URL = value
                    elif key == "DATABASE_TYPE" and value:
                        self.DATABASE_TYPE = value
                    elif key == "SECRET_KEY" and value:
                        self.SECRET_KEY = value
                    elif key == "ALLOWED_ORIGINS" and value:
                        self.ALLOWED_ORIGINS = value
                    elif key == "ENVIRONMENT" and value:
                        self.ENVIRONMENT = value

        if self.DATABASE_URL.startswith("postgresql") or self.DATABASE_TYPE.lower() == "postgresql":
            self.DATABASE_TYPE = "postgresql"
            if self.DATABASE_URL.startswith("sqlite") or not self.DATABASE_URL:
                self.DATABASE_URL = (
                    f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
                    f"{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
                )
            if self.ASYNC_DATABASE_URL.startswith("sqlite") or not self.ASYNC_DATABASE_URL:
                self.ASYNC_DATABASE_URL = self.DATABASE_URL.replace(
                    "postgresql://", "postgresql+asyncpg://", 1
                )
        else:
            self.DATABASE_TYPE = "sqlite"
            if not self.DATABASE_URL or self.DATABASE_URL.startswith("postgresql"):
                self.DATABASE_URL = self.SQLITE_DATABASE_URL
            if not self.ASYNC_DATABASE_URL or self.ASYNC_DATABASE_URL.startswith("postgresql"):
                self.ASYNC_DATABASE_URL = self.SQLITE_ASYNC_DATABASE_URL
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()