from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path
import time

import pytest
from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, inspect, select, text
from sqlalchemy.engine import make_url
from sqlalchemy.pool import NullPool

from app.database import database as database_module
from app.database.migration_infrastructure.epoch_control import (
    EPOCH_AUDIT_TABLE,
    EpochTransitionState,
    epoch_control_snapshot,
)
from app.database.migration_infrastructure.epoch_state import CONTROL_TABLES
from app.database.migration_infrastructure.migration_coordinator import (
    acquire_postgresql_migration_ownership,
)
from app.database.migration_infrastructure.schema_manifest import build_schema_manifest
from app.database.migration_preflight import build_epoch_preflight_report
import run_migrations


BACKEND_ROOT = Path(__file__).resolve().parents[2]
_POSTGRESQL_TEST_URL = os.environ.get("QUBIRA_TEST_POSTGRESQL_URL", "")
_POSTGRESQL_TEST_URL_OBJ = (
    make_url(_POSTGRESQL_TEST_URL) if _POSTGRESQL_TEST_URL else None
)
_SAFE_TEST_TARGET = (
    _POSTGRESQL_TEST_URL_OBJ is not None
    and _POSTGRESQL_TEST_URL_OBJ.host in {"127.0.0.1", "localhost", "::1"}
    and (_POSTGRESQL_TEST_URL_OBJ.database or "").startswith("qubira_test_")
)

pytestmark = pytest.mark.skipif(
    not _SAFE_TEST_TARGET,
    reason="Requires a uniquely named loopback disposable PostgreSQL database.",
)


def test_epoch_fresh_install_is_coordinated_and_readiness_is_read_only() -> None:
    assert _POSTGRESQL_TEST_URL_OBJ is not None
    engine = database_module.engine
    assert engine.dialect.name == "postgresql"
    with engine.connect() as connection:
        assert int(connection.exec_driver_sql("SHOW server_version_num").scalar_one()) == 180006
        assert not inspect(connection).get_table_names()

    assert run_migrations.run_migrations() == 0

    epoch_config = Config(str(BACKEND_ROOT / "alembic_epoch.ini"))
    epoch_script = ScriptDirectory.from_config(epoch_config)
    assert len(epoch_script.get_heads()) == 1
    with acquire_postgresql_migration_ownership(_POSTGRESQL_TEST_URL_OBJ) as owner:
        names = set(inspect(owner.connection).get_table_names())
        assert "alembic_version" not in names
        assert "alembic_version_epoch" in names
        assert CONTROL_TABLES <= names
        revisions = owner.connection.execute(
            text("SELECT version_num FROM alembic_version_epoch")
        ).scalars().all()
        assert revisions == epoch_script.get_heads()
        snapshot = epoch_control_snapshot(owner.connection)
        assert snapshot["state"] is EpochTransitionState.VERIFIED
        assert snapshot["plan_digest"]
        assert snapshot["database_identity_digest"]
        assert len(
            owner.connection.execute(select(EPOCH_AUDIT_TABLE.c.event_id)).all()
        ) == 5
        before_manifest = build_schema_manifest(owner.connection)["sha256"]
        before_generation = snapshot["generation"]
        owner.connection.commit()

    report = build_epoch_preflight_report(engine)
    assert report["eligible_for_migration"] is True
    assert report["current_revision"] == epoch_script.get_heads()[0]

    with acquire_postgresql_migration_ownership(_POSTGRESQL_TEST_URL_OBJ) as owner:
        after_manifest = build_schema_manifest(owner.connection)["sha256"]
        after_snapshot = epoch_control_snapshot(owner.connection)
        assert after_manifest == before_manifest
        assert after_snapshot["generation"] == before_generation
        assert run_migrations.run_migrations() == 1
        assert epoch_control_snapshot(owner.connection)["generation"] == before_generation
        owner.connection.commit()

    assert run_migrations.run_migrations() == 0
    with acquire_postgresql_migration_ownership(_POSTGRESQL_TEST_URL_OBJ) as owner:
        assert epoch_control_snapshot(owner.connection)["generation"] == before_generation
        owner.connection.commit()

    environment = os.environ.copy()
    direct = subprocess.run(
        [
            sys.executable,
            "-m",
            "alembic",
            "-c",
            "alembic_epoch.ini",
            "upgrade",
            "head",
        ],
        cwd=BACKEND_ROOT,
        env=environment,
        capture_output=True,
        text=True,
        timeout=30,
        check=False,
    )
    assert direct.returncode != 0
    assert "active coordinated PostgreSQL lease" in direct.stderr


def test_interrupted_epoch_attempt_is_not_retried_automatically(monkeypatch) -> None:
    if os.environ.get("QUBIRA_EPOCH_FAILURE_TEST") != "1":
        pytest.skip("This test requires its own empty disposable failure-test database.")

    assert _POSTGRESQL_TEST_URL_OBJ is not None
    execution_count = 0

    def fail_after_transactional_ddl(config, _revision):
        nonlocal execution_count
        execution_count += 1
        connection = config.attributes["connection"]
        connection.execute(text("CREATE TABLE epoch_failure_probe (id integer PRIMARY KEY)"))
        raise RuntimeError("injected transactional DDL failure")

    monkeypatch.setattr(run_migrations.command, "upgrade", fail_after_transactional_ddl)
    assert run_migrations.run_migrations() == 1
    with acquire_postgresql_migration_ownership(_POSTGRESQL_TEST_URL_OBJ) as owner:
        snapshot = epoch_control_snapshot(owner.connection)
        assert snapshot["state"] is EpochTransitionState.RECOVERY_REQUIRED
        names = set(inspect(owner.connection).get_table_names())
        assert "epoch_failure_probe" not in names
        assert "alembic_version_epoch" not in names
        generation = snapshot["generation"]
        owner.connection.commit()

    assert run_migrations.run_migrations() == 1
    assert execution_count == 1
    with acquire_postgresql_migration_ownership(_POSTGRESQL_TEST_URL_OBJ) as owner:
        snapshot = epoch_control_snapshot(owner.connection)
        assert snapshot["state"] is EpochTransitionState.RECOVERY_REQUIRED
        assert snapshot["generation"] == generation
        owner.connection.commit()


def test_process_termination_leaves_durable_intent_and_requires_recovery() -> None:
    if os.environ.get("QUBIRA_EPOCH_TERMINATION_TEST") != "1":
        pytest.skip("This test requires its own empty disposable termination-test database.")

    assert _POSTGRESQL_TEST_URL_OBJ is not None
    marker = Path(os.environ["QUBIRA_EPOCH_TERMINATION_MARKER"])
    environment = os.environ.copy()
    child_script = """
import os
import time
from pathlib import Path
import run_migrations

def block_during_upgrade(_config, _revision):
    Path(os.environ["QUBIRA_EPOCH_TERMINATION_MARKER"]).write_text("applying")
    while True:
        time.sleep(1)

run_migrations.command.upgrade = block_during_upgrade
run_migrations.run_migrations()
"""
    process = subprocess.Popen(
        [sys.executable, "-c", child_script],
        cwd=BACKEND_ROOT,
        env=environment,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        deadline = time.monotonic() + 30
        while time.monotonic() < deadline and not marker.exists():
            if process.poll() is not None:
                pytest.fail(f"Migration child exited before the applying checkpoint: {process.returncode}")
            time.sleep(0.1)
        assert marker.exists(), "Migration child did not reach the durable applying state."
        read_engine = create_engine(_POSTGRESQL_TEST_URL_OBJ, poolclass=NullPool)
        try:
            with read_engine.connect() as connection:
                state = connection.execute(
                    text("SELECT state FROM qubira_epoch_control WHERE singleton_id = 1")
                ).scalar_one()
                assert state == EpochTransitionState.APPLYING.value
        finally:
            read_engine.dispose()

        process.terminate()
        process.wait(timeout=10)
    finally:
        if process.poll() is None:
            process.kill()
            process.wait(timeout=10)
        marker.unlink(missing_ok=True)

    assert run_migrations.run_migrations() == 1
    with acquire_postgresql_migration_ownership(_POSTGRESQL_TEST_URL_OBJ) as owner:
        snapshot = epoch_control_snapshot(owner.connection)
        assert snapshot["state"] is EpochTransitionState.RECOVERY_REQUIRED
        names = set(inspect(owner.connection).get_table_names())
        assert "alembic_version_epoch" not in names
        assert not (names - set(CONTROL_TABLES))
        owner.connection.commit()


def test_committed_revision_with_failed_verification_requires_recovery(monkeypatch) -> None:
    if os.environ.get("QUBIRA_EPOCH_VERIFY_FAILURE_TEST") != "1":
        pytest.skip("This test requires its own empty disposable verification-test database.")

    assert _POSTGRESQL_TEST_URL_OBJ is not None
    upgrade = run_migrations.command.upgrade
    execution_count = 0

    def count_upgrade(config, revision):
        nonlocal execution_count
        execution_count += 1
        upgrade(config, revision)

    def reject_verification(*_args, **_kwargs):
        raise RuntimeError("injected post-commit verification failure")

    monkeypatch.setattr(run_migrations.command, "upgrade", count_upgrade)
    monkeypatch.setattr(run_migrations, "_verify_epoch_database", reject_verification)
    assert run_migrations.run_migrations() == 1
    with acquire_postgresql_migration_ownership(_POSTGRESQL_TEST_URL_OBJ) as owner:
        snapshot = epoch_control_snapshot(owner.connection)
        assert snapshot["state"] is EpochTransitionState.RECOVERY_REQUIRED
        assert owner.connection.execute(
            text("SELECT version_num FROM alembic_version_epoch")
        ).scalars().one()
        names = set(inspect(owner.connection).get_table_names())
        assert CONTROL_TABLES <= names
        assert "alembic_version" not in names
        generation = snapshot["generation"]
        owner.connection.commit()

    assert run_migrations.run_migrations() == 1
    assert execution_count == 1
    with acquire_postgresql_migration_ownership(_POSTGRESQL_TEST_URL_OBJ) as owner:
        snapshot = epoch_control_snapshot(owner.connection)
        assert snapshot["state"] is EpochTransitionState.RECOVERY_REQUIRED
        assert snapshot["generation"] == generation
        owner.connection.commit()
