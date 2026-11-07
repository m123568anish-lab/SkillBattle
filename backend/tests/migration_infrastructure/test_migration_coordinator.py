from __future__ import annotations

import os
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

import pytest
from sqlalchemy import create_engine, event

from app.database.migration_infrastructure.migration_coordinator import (
    MaintenanceWindowEvidence,
    MigrationCoordinationError,
    acquire_sqlite_migration_ownership,
)


WINDOWS_ONLY = pytest.mark.skipif(
    sys.platform != "win32",
    reason="The current migration lock supports Windows local NTFS only.",
)


class StaticMaintenanceVerifier:
    def __init__(
        self,
        database_path: Path,
        *,
        active: bool = False,
    ) -> None:
        identity = os.path.normcase(str(database_path.resolve()))
        self.evidence = MaintenanceWindowEvidence(
            database_identity=identity,
            evidence_id="disposable-test-evidence",
            issued_at=datetime.now(timezone.utc),
            application_processes_stopped=not active,
            worker_processes_stopped=not active,
            sync_pools_disposed=not active,
            async_pools_disposed=not active,
            background_tasks_stopped=not active,
            scheduled_jobs_stopped=not active,
            raw_connections_closed=not active,
            external_access_controlled=not active,
        )

    def verify(self, database_path: Path) -> MaintenanceWindowEvidence:
        assert database_path == Path(self.evidence.database_identity)
        return self.evidence


@WINDOWS_ONLY
def test_coordinator_holds_lock_and_creates_verified_data_preserving_backup(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "known-schema.db"
    backup_path = tmp_path / "known-schema.backup.db"
    with sqlite3.connect(database_path) as connection:
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("CREATE TABLE parent (id INTEGER PRIMARY KEY)")
        connection.execute(
            "CREATE TABLE child (id INTEGER PRIMARY KEY, parent_id INTEGER "
            "REFERENCES parent(id))"
        )
        connection.execute("INSERT INTO parent VALUES (11)")
        connection.execute("INSERT INTO child VALUES (19, 11)")

    engine = create_engine(f"sqlite:///{database_path}")
    try:
        with acquire_sqlite_migration_ownership(
            engine,
            StaticMaintenanceVerifier(database_path),
            backup_path,
        ) as ownership:
            assert ownership.is_active
            assert ownership.backup.integrity_check == "ok"
            assert ownership.backup.foreign_key_violations == 0
            assert ownership.backup.table_row_counts == (
                ("child", 1),
                ("parent", 1),
            )
            assert ownership.backup.sha256
            assert ownership.backup.backup_path == backup_path
            assert ownership.connection.exec_driver_sql(
                "SELECT parent_id FROM child WHERE id = 19"
            ).scalar_one() == 11

        assert not ownership.is_active
        with sqlite3.connect(backup_path) as backup:
            assert backup.execute("SELECT id FROM parent").fetchall() == [(11,)]
            assert backup.execute("SELECT id, parent_id FROM child").fetchall() == [
                (19, 11)
            ]
    finally:
        engine.dispose()


@WINDOWS_ONLY
def test_coordinator_refuses_when_application_process_is_reported_active(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "active-app.db"
    backup_path = tmp_path / "must-not-exist.backup.db"
    with sqlite3.connect(database_path) as connection:
        connection.execute("CREATE TABLE sample (id INTEGER)")

    engine = create_engine(f"sqlite:///{database_path}")
    try:
        with pytest.raises(
            MigrationCoordinationError,
            match="(?i)maintenance window is incomplete",
        ):
            with acquire_sqlite_migration_ownership(
                engine,
                StaticMaintenanceVerifier(database_path, active=True),
                backup_path,
            ):
                pytest.fail("Migration ownership must not be granted.")
        assert not backup_path.exists()
    finally:
        engine.dispose()


@WINDOWS_ONLY
def test_coordinator_requires_external_verifier_before_opening_database(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "no-verifier.db"
    backup_path = tmp_path / "no-verifier.backup.db"
    engine = create_engine(f"sqlite:///{database_path}")
    opened_connections: list[bool] = []
    event.listen(
        engine,
        "connect",
        lambda *_args: opened_connections.append(True),
    )
    try:
        with pytest.raises(MigrationCoordinationError, match="No trusted maintenance-window verifier"):
            with acquire_sqlite_migration_ownership(engine, None, backup_path):
                pytest.fail("Migration ownership must not be granted.")
        assert opened_connections == []
        assert not database_path.exists()
        assert not backup_path.exists()
    finally:
        engine.dispose()


@WINDOWS_ONLY
def test_coordinator_rejects_reused_backup_path_without_overwriting(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "existing.db"
    backup_path = tmp_path / "existing.backup.db"
    backup_path.write_bytes(b"keep")
    engine = create_engine(f"sqlite:///{database_path}")
    try:
        with pytest.raises(FileExistsError):
            with acquire_sqlite_migration_ownership(
                engine,
                StaticMaintenanceVerifier(database_path),
                backup_path,
            ):
                pytest.fail("An existing backup must not be overwritten.")
        assert backup_path.read_bytes() == b"keep"
        assert not database_path.exists()
    finally:
        engine.dispose()


@WINDOWS_ONLY
def test_coordinator_rejects_unverified_sqlite_foreign_key_state(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "bad-fk.db"
    backup_path = tmp_path / "bad-fk.backup.db"
    with sqlite3.connect(database_path) as connection:
        connection.execute("PRAGMA foreign_keys = OFF")
        connection.execute("CREATE TABLE parent (id INTEGER PRIMARY KEY)")
        connection.execute(
            "CREATE TABLE child (parent_id INTEGER REFERENCES parent(id))"
        )
        connection.execute("INSERT INTO child VALUES (404)")

    engine = create_engine(f"sqlite:///{database_path}")
    try:
        with pytest.raises(MigrationCoordinationError, match="foreign-key violations"):
            with acquire_sqlite_migration_ownership(
                engine,
                StaticMaintenanceVerifier(database_path),
                backup_path,
            ):
                pytest.fail("A backup with invalid foreign keys must be refused.")
        assert backup_path.exists()
    finally:
        engine.dispose()
