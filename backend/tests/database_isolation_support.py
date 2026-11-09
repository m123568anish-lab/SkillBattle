import atexit
import asyncio
import os
import re
import shutil
import sys
import tempfile
from pathlib import Path

from sqlalchemy.engine import URL, make_url


_BACKEND_ROOT = Path(__file__).resolve().parents[1]
PROTECTED_SQLITE_PATH = (_BACKEND_ROOT.parent / "skillbattle.db").resolve()
_TEMP_DATABASE_DIRECTORY = None


def validate_test_database_url(database_url: str) -> URL:
    if not database_url or not database_url.strip():
        raise ValueError("Tests require an explicit disposable database URL.")
    try:
        url = make_url(database_url.strip())
    except Exception as error:
        raise ValueError("The test database URL is invalid.") from error

    if url.drivername.startswith("sqlite"):
        if not url.database or url.database == ":memory:":
            raise ValueError("SQLite tests require a unique temporary database file.")
        database_path = Path(url.database)
        if not database_path.is_absolute():
            database_path = _BACKEND_ROOT.parent / database_path
        database_path = database_path.resolve()
        if database_path == PROTECTED_SQLITE_PATH:
            raise ValueError("Tests may not use the protected repository SQLite database.")
        try:
            database_path.relative_to(Path(tempfile.gettempdir()).resolve())
        except ValueError as error:
            raise ValueError("SQLite test databases must be located in the system temp directory.") from error
        return url

    if url.drivername.startswith("postgresql"):
        host = (url.host or "").strip("[]").lower()
        database_name = (url.database or "").lower()
        if host not in {"localhost", "127.0.0.1", "::1"}:
            raise ValueError("PostgreSQL tests require a disposable loopback database.")
        if not re.search(r"(^|[_-])test([_-]|$)", database_name):
            raise ValueError("PostgreSQL test database names must contain a distinct 'test' segment.")
        return url

    raise ValueError("Tests support only temporary SQLite or disposable loopback PostgreSQL URLs.")


def _database_identity(url: URL) -> tuple:
    return url.host, url.port, url.username, url.password, url.database


def _configure_test_database() -> str:
    global _TEMP_DATABASE_DIRECTORY

    os.environ["QUBIRA_TEST_MODE"] = "1"
    os.environ.pop("QUBIRA_TEST_ENV_FILE", None)
    os.environ.pop("QUBIRA_TEST_ALLOW_ENV_FILES", None)

    database_url = os.environ.get("DATABASE_URL", "").strip()
    async_database_url = os.environ.get("ASYNC_DATABASE_URL", "").strip()
    if not database_url:
        if async_database_url:
            raise ValueError("Tests require DATABASE_URL; an async-only database URL is not sufficient.")
        _TEMP_DATABASE_DIRECTORY = tempfile.mkdtemp(prefix="qubira-pytest-")
        database_url = URL.create(
            "sqlite",
            database=str(Path(_TEMP_DATABASE_DIRECTORY) / "database.sqlite3"),
        ).render_as_string(hide_password=False)
        os.environ["DATABASE_URL"] = database_url

    database = validate_test_database_url(database_url)
    database_type = "postgresql" if database.drivername.startswith("postgresql") else "sqlite"
    configured_type = os.environ.get("DATABASE_TYPE", "").strip().lower()
    if configured_type and configured_type != database_type:
        raise ValueError("DATABASE_TYPE does not match the explicitly selected test database.")

    if database_type == "sqlite":
        sync_database = database
        async_database = database.set(drivername="sqlite+aiosqlite")
    else:
        sync_database = database
        async_database = database.set(drivername="postgresql+asyncpg")

    if async_database_url:
        supplied_async_database = validate_test_database_url(async_database_url)
        if _database_identity(supplied_async_database) != _database_identity(sync_database):
            raise ValueError("DATABASE_URL and ASYNC_DATABASE_URL must identify the same test database.")

    if _TEMP_DATABASE_DIRECTORY is None:
        _TEMP_DATABASE_DIRECTORY = tempfile.mkdtemp(prefix="qubira-pytest-")
    sqlite_database = URL.create(
        "sqlite",
        database=str(Path(_TEMP_DATABASE_DIRECTORY) / "sqlite-fallback.sqlite3"),
    )
    sqlite_async_database = sqlite_database.set(drivername="sqlite+aiosqlite")

    os.environ.update(
        {
            "DATABASE_URL": sync_database.render_as_string(hide_password=False),
            "ASYNC_DATABASE_URL": async_database.render_as_string(hide_password=False),
            "DATABASE_TYPE": database_type,
            "SQLITE_DATABASE_URL": sqlite_database.render_as_string(hide_password=False),
            "SQLITE_ASYNC_DATABASE_URL": sqlite_async_database.render_as_string(hide_password=False),
            "MIGRATION_DATABASE_URL": "",
            "RESET_DB": "false",
            "ENVIRONMENT": "test",
        }
    )
    return os.environ["DATABASE_URL"]


def _cleanup_test_database() -> None:
    database_module = sys.modules.get("app.database.database")
    if database_module is not None:
        database_module.engine.dispose()
    session_module = sys.modules.get("app.database.session")
    if session_module is not None:
        asyncio.run(session_module.engine.dispose())
    if _TEMP_DATABASE_DIRECTORY is not None:
        shutil.rmtree(_TEMP_DATABASE_DIRECTORY)


atexit.register(_cleanup_test_database)
TEST_DATABASE_URL = _configure_test_database()
