"""
=========================================================

SkillBattle

Application Configuration

=========================================================
"""

from __future__ import annotations

import logging
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict

logger = logging.getLogger(__name__)


class Settings(BaseSettings):

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
    
    # SQLite
    SQLITE_DATABASE_URL: str = "sqlite:///./skillbattle.db"
    SQLITE_ASYNC_DATABASE_URL: str = "sqlite+aiosqlite:///./skillbattle.db"
    
    # PostgreSQL
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "skillbattle"
    POSTGRES_PASSWORD: str = "skillbattle"
    POSTGRES_DB: str = "skillbattle_db"

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

    model_config = SettingsConfigDict(
        env_file=".env.local",
        case_sensitive=True,
        extra="ignore",
    )

    @property
    def DATABASE_URL(self) -> str:
        """Get the synchronous database URL based on database type."""
        if self.DATABASE_TYPE.lower() == "postgresql":
            return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        else:
            return self.SQLITE_DATABASE_URL

    @property
    def ASYNC_DATABASE_URL(self) -> str:
        """Get the asynchronous database URL based on database type."""
        if self.DATABASE_TYPE.lower() == "postgresql":
            return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        else:
            return self.SQLITE_ASYNC_DATABASE_URL


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()