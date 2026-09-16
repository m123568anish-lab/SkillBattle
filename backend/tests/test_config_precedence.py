import os
from pathlib import Path

from app.core.config import Settings


def test_local_sqlite_settings_override_production_defaults(monkeypatch):
    backend_dir = Path(__file__).resolve().parents[1]
    monkeypatch.chdir(backend_dir)

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
    assert settings.DATABASE_URL == "sqlite:///./skillbattle.db"
    assert settings.ASYNC_DATABASE_URL == "sqlite+aiosqlite:///./skillbattle.db"
