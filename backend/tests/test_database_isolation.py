import os
import inspect
from pathlib import Path
import subprocess
import sys

import pytest
from sqlalchemy.engine import make_url

from app.core.config import Settings, load_environment_file_values
from app.database.init_db import init_db
from database_isolation_support import (
    PROTECTED_SQLITE_PATH,
    TEST_DATABASE_URL,
    validate_test_database_url,
)


def test_default_test_database_is_a_unique_temporary_sqlite_file():
    database_path = Path(make_url(TEST_DATABASE_URL).database)

    assert database_path.parent.name.startswith("qubira-pytest-")
    assert database_path != PROTECTED_SQLITE_PATH


def test_protected_repository_sqlite_database_is_rejected():
    protected_url = f"sqlite:///{PROTECTED_SQLITE_PATH.as_posix()}"

    with pytest.raises(ValueError, match="protected repository SQLite database"):
        validate_test_database_url(protected_url)


def test_test_harness_rejects_the_default_database_before_app_import():
    environment = os.environ.copy()
    environment.update(
        {
            "DATABASE_URL": "sqlite:///./skillbattle.db",
            "ASYNC_DATABASE_URL": "",
            "DATABASE_TYPE": "sqlite",
            "ENVIRONMENT": "test",
        }
    )
    result = subprocess.run(
        [sys.executable, "-c", "import database_isolation_support"],
        cwd=Path(__file__).parent,
        env=environment,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode != 0
    assert "protected repository SQLite database" in result.stderr


def test_test_harness_keeps_an_explicit_loopback_postgresql_url():
    database_url = "postgresql://test_user:test_password@127.0.0.1:5432/qubira_test_isolation"
    environment = os.environ.copy()
    environment.update(
        {
            "DATABASE_URL": database_url,
            "ASYNC_DATABASE_URL": database_url.replace("postgresql://", "postgresql+asyncpg://"),
            "DATABASE_TYPE": "postgresql",
            "ENVIRONMENT": "test",
        }
    )
    result = subprocess.run(
        [
            sys.executable,
            "-c",
            "from sqlalchemy.engine import make_url; from database_isolation_support import TEST_DATABASE_URL; print(make_url(TEST_DATABASE_URL).drivername)",
        ],
        cwd=Path(__file__).parent,
        env=environment,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    assert result.stdout.strip() == "postgresql"


def test_sqlite_test_database_outside_system_temp_directory_is_rejected():
    outside_temp = PROTECTED_SQLITE_PATH.parent / "isolated-test-database.sqlite3"
    with pytest.raises(ValueError, match="system temp directory"):
        validate_test_database_url(f"sqlite:///{outside_temp.as_posix()}")


def test_test_mode_does_not_load_developer_dotenv_files(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("QUBIRA_TEST_ENV_FILE", raising=False)
    monkeypatch.delenv("ISOLATION_SENTINEL", raising=False)
    (tmp_path / ".env.local").write_text("ISOLATION_SENTINEL=local\n", encoding="utf-8")
    (tmp_path / ".env.production").write_text("ISOLATION_SENTINEL=production\n", encoding="utf-8")

    load_environment_file_values()

    assert "ISOLATION_SENTINEL" not in os.environ


@pytest.mark.parametrize(
    "database_url",
    [
        "postgresql://test:test@db.example.invalid/qubira_test",
        "postgresql://test:test@127.0.0.1/qubira",
    ],
)
def test_unsafe_postgresql_test_database_is_rejected(database_url):
    with pytest.raises(ValueError):
        validate_test_database_url(database_url)


def test_settings_preserve_an_explicit_postgresql_test_url(monkeypatch):
    database_url = "postgresql://test_user:test_password@127.0.0.1:5432/qubira_test_config"
    monkeypatch.setenv("DATABASE_URL", database_url)
    monkeypatch.setenv("ASYNC_DATABASE_URL", database_url.replace("postgresql://", "postgresql+asyncpg://"))
    monkeypatch.setenv("DATABASE_TYPE", "postgresql")
    monkeypatch.setenv("ENVIRONMENT", "test")

    settings = Settings(_env_file=None)

    assert settings.DATABASE_TYPE == "postgresql"
    assert settings.DATABASE_URL == database_url
    assert settings.ASYNC_DATABASE_URL.startswith("postgresql+asyncpg://")


def test_init_db_requires_an_explicit_url():
    parameter = inspect.signature(init_db).parameters["database_url"]

    assert parameter.default is inspect.Parameter.empty
    assert parameter.kind is inspect.Parameter.KEYWORD_ONLY


def test_init_db_rejects_a_database_url_that_does_not_match_the_engine():
    with pytest.raises(ValueError, match="explicit URL matching"):
        init_db(database_url="sqlite:///C:/protected/unknown.sqlite3")
