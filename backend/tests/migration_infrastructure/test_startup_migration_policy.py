from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[2]
REPOSITORY_ROOT = BACKEND_ROOT.parent


def test_deployable_render_commands_start_api_without_running_migrations() -> None:
    for render_file in (
        REPOSITORY_ROOT / "render.yaml",
        REPOSITORY_ROOT / "frontend" / "render.yaml",
    ):
        configuration = render_file.read_text(encoding="utf-8")
        start_command = next(
            line for line in configuration.splitlines() if "startCommand:" in line
        )
        health_check = next(
            line for line in configuration.splitlines() if "healthCheckPath:" in line
        )

        assert "uvicorn" in start_command
        assert "run_migrations" not in start_command
        assert "alembic" not in start_command
        assert any(path in health_check for path in ("/health", "/ready"))


def test_container_entrypoints_do_not_run_migrations() -> None:
    for entrypoint in (
        BACKEND_ROOT / "entrypoint.sh",
        REPOSITORY_ROOT / "frontend" / "backend" / "entrypoint.sh",
    ):
        script = entrypoint.read_text(encoding="utf-8")

        assert "exec \"$@\"" in script
        assert "run_migrations" not in script
        assert "alembic" not in script


def test_legacy_runner_contains_no_schema_bootstrap_or_stamp_path() -> None:
    runner = (BACKEND_ROOT / "run_migrations.py").read_text(encoding="utf-8")

    assert "create_all(" not in runner
    assert ".stamp(" not in runner
    assert "no supported fresh-install baseline" in runner


def test_nested_legacy_alembic_refuses_before_opening_a_database(tmp_path: Path) -> None:
    nested_backend = REPOSITORY_ROOT / "frontend" / "backend"
    database_path = tmp_path / "must-not-be-opened.sqlite3"
    environment = os.environ.copy()
    environment.update(
        {
            "DATABASE_URL": f"sqlite:///{database_path.as_posix()}",
            "ENVIRONMENT": "test",
        }
    )
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=nested_backend,
        env=environment,
        capture_output=True,
        text=True,
        timeout=30,
        check=False,
    )

    assert result.returncode != 0
    assert "Direct Alembic execution is disabled" in result.stderr + result.stdout
    assert not database_path.exists()


def test_nested_api_startup_has_no_model_bootstrap_call() -> None:
    main_source = (
        REPOSITORY_ROOT / "frontend" / "backend" / "app" / "main.py"
    ).read_text(encoding="utf-8")

    assert "init_db" not in main_source
    assert "create_all(" not in main_source


def test_nested_model_bootstrap_is_disabled_without_opening_a_database() -> None:
    nested_backend = REPOSITORY_ROOT / "frontend" / "backend"
    result = subprocess.run(
        [
            sys.executable,
            "-c",
            "from app.database.init_db import init_db; init_db()",
        ],
        cwd=nested_backend,
        env=os.environ.copy(),
        capture_output=True,
        text=True,
        timeout=30,
        check=False,
    )

    assert result.returncode != 0
    assert "Model-based database initialization is disabled" in (
        result.stderr + result.stdout
    )
