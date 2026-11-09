import os

from app.core.config import Settings
import pytest


def test_local_sqlite_settings_override_production_defaults(monkeypatch):
    for key in [
        "DATABASE_TYPE",
        "DATABASE_URL",
        "ASYNC_DATABASE_URL",
        "POSTGRES_HOST",
        "POSTGRES_PORT",
        "POSTGRES_DB",
        "POSTGRES_USER",
        "POSTGRES_PASSWORD",
    ]:
        monkeypatch.delenv(key, raising=False)

    settings = Settings()

    assert settings.DATABASE_TYPE == "sqlite"
    assert settings.DATABASE_URL == os.environ["SQLITE_DATABASE_URL"]
    assert settings.ASYNC_DATABASE_URL == os.environ["SQLITE_ASYNC_DATABASE_URL"]


def test_production_rejects_placeholder_database_url(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("SECRET_KEY", "a_very_long_secure_production_secret_key_123456789")
    monkeypatch.setenv("DATABASE_URL", "******ep-xxx.neon.tech/skillbattle_db")
    monkeypatch.setenv("ASYNC_DATABASE_URL", "******ep-xxx.neon.tech/skillbattle_db")

    with pytest.raises(ValueError, match="real PostgreSQL DATABASE_URL"):
        Settings(_env_file=None)
