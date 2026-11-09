from __future__ import annotations

import os
import sqlite3
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

import pytest
from sqlalchemy import create_engine, event

from app.database.migration_infrastructure import migration_coordinator
from app.database.migration_infrastructure.epoch_state import (
    EpochControlStateError,
    assert_legacy_runner_allowed,
)
from app.database.migration_infrastructure.migration_coordinator import (
    MaintenanceWindowEvidence,
    MigrationCoordinationError,
    acquire_sqlite_migration_ownership,
    require_supported_migration_dialect,
)


WINDOWS_ONLY = pytest.mark.skipif(
    sys.platform != "win32",
    reason="The current migration lock supports Windows local NTFS only.",
)
BACKEND_ROOT = Path(__file__).resolve().parents[2]


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
def test_coordinator_accepts_fresh_disposable_database_without_creating_epoch_state(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "fresh.db"
    backup_path = tmp_path / "fresh.backup.db"
    engine = create_engine(f"sqlite:///{database_path}")
    try:
        with acquire_sqlite_migration_ownership(
            engine,
            StaticMaintenanceVerifier(database_path),
            backup_path,
        ) as ownership:
            assert ownership.backup.table_row_counts == ()
            assert ownership.backup.integrity_check == "ok"
            ownership.connection.exec_driver_sql(
                "CREATE TABLE disposable_probe (id INTEGER PRIMARY KEY)"
            )
            ownership.connection.commit()

        with sqlite3.connect(backup_path) as backup:
            assert backup.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            ).fetchall() == []
        with sqlite3.connect(database_path) as database:
            assert database.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            ).fetchall() == [("disposable_probe",)]
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


@WINDOWS_ONLY
def test_coordinator_rechecks_live_database_against_backup_before_yield(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    database_path = tmp_path / "changed-after-backup.db"
    backup_path = tmp_path / "changed-after-backup.snapshot.db"
    with sqlite3.connect(database_path) as connection:
        connection.execute("CREATE TABLE sample (id INTEGER PRIMARY KEY)")
        connection.execute("INSERT INTO sample VALUES (1)")

    create_backup = migration_coordinator.create_verified_sqlite_backup

    def create_backup_then_change_database(
        source_path: str | os.PathLike[str],
        destination_path: str | os.PathLike[str],
    ):
        receipt = create_backup(source_path, destination_path)
        with sqlite3.connect(database_path) as connection:
            connection.execute("INSERT INTO sample VALUES (2)")
        return receipt

    monkeypatch.setattr(
        migration_coordinator,
        "create_verified_sqlite_backup",
        create_backup_then_change_database,
    )
    engine = create_engine(f"sqlite:///{database_path}")
    try:
        with pytest.raises(
            MigrationCoordinationError,
            match="differs from its verified pre-migration backup",
        ):
            with acquire_sqlite_migration_ownership(
                engine,
                StaticMaintenanceVerifier(database_path),
                backup_path,
            ):
                pytest.fail("Changed source state must not be authorized.")
    finally:
        engine.dispose()


@WINDOWS_ONLY
def test_legacy_runner_refuses_sqlite_without_maintenance_verifier(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "runner-must-not-open.db"
    environment = os.environ.copy()
    sqlite_url = f"sqlite:///{database_path.as_posix()}"
    environment.update(
        {
            "DATABASE_URL": sqlite_url,
            "SQLITE_DATABASE_URL": sqlite_url,
            "ASYNC_DATABASE_URL": f"sqlite+aiosqlite:///{database_path.as_posix()}",
            "SQLITE_ASYNC_DATABASE_URL": f"sqlite+aiosqlite:///{database_path.as_posix()}",
            "PYTHONDONTWRITEBYTECODE": "1",
        }
    )
    result = subprocess.run(
        [sys.executable, "run_migrations.py"],
        cwd=BACKEND_ROOT,
        env=environment,
        capture_output=True,
        text=True,
        timeout=30,
        check=False,
    )
    assert result.returncode == 1
    assert "No trusted maintenance-window verifier" in result.stdout
    assert not database_path.exists()


def test_legacy_runner_refuses_uncoordinated_database_dialect() -> None:
    with pytest.raises(MigrationCoordinationError, match="blocked for 'postgresql'"):
        require_supported_migration_dialect("postgresql")

    require_supported_migration_dialect("sqlite")


@WINDOWS_ONLY
def test_two_migration_coordinators_serialize_across_processes(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "competing-runners.db"
    first_backup = tmp_path / "first-runner.backup.db"
    second_backup = tmp_path / "second-runner.backup.db"
    first_marker = tmp_path / "first-runner.ready"
    second_marker = tmp_path / "second-runner.ready"
    with sqlite3.connect(database_path) as connection:
        connection.execute("CREATE TABLE sample (id INTEGER PRIMARY KEY)")

    process_code = """
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from sqlalchemy import create_engine, inspect
from app.database.migration_infrastructure.epoch_state import (
    EpochControlStateError,
    assert_legacy_runner_allowed,
)
from app.database.migration_infrastructure.migration_coordinator import (
    MaintenanceWindowEvidence,
    acquire_sqlite_migration_ownership,
)

database_path = Path(sys.argv[1]).resolve()
backup_path = Path(sys.argv[2])
marker = Path(sys.argv[3])
role = sys.argv[4]
class Verifier:
    def verify(self, path):
        return MaintenanceWindowEvidence(
            database_identity=os.path.normcase(str(path)),
            evidence_id=marker.name,
            issued_at=datetime.now(timezone.utc),
            application_processes_stopped=True,
            worker_processes_stopped=True,
            sync_pools_disposed=True,
            async_pools_disposed=True,
            background_tasks_stopped=True,
            scheduled_jobs_stopped=True,
            raw_connections_closed=True,
            external_access_controlled=True,
        )

engine = create_engine(f"sqlite:///{database_path.as_posix()}")
try:
    with acquire_sqlite_migration_ownership(
        engine, Verifier(), backup_path, timeout=10
    ) as ownership:
        if role == "transition":
            ownership.connection.exec_driver_sql(
                "CREATE TABLE qubira_epoch_control (id INTEGER PRIMARY KEY)"
            )
            ownership.connection.exec_driver_sql(
                "CREATE TABLE qubira_epoch_audit (id INTEGER PRIMARY KEY)"
            )
            ownership.connection.commit()
            marker.write_text("transition-started", encoding="utf-8")
            sys.stdin.readline()
        else:
            try:
                assert_legacy_runner_allowed(inspect(ownership.connection).get_table_names())
            except EpochControlStateError:
                marker.write_text("legacy-refused", encoding="utf-8")
            else:
                raise AssertionError("Legacy runner did not refuse epoch state.")
finally:
    engine.dispose()
"""

    def start_process(backup: Path, marker: Path) -> subprocess.Popen[str]:
        return subprocess.Popen(
            [
                sys.executable,
                "-c",
                process_code,
                str(database_path),
                str(backup),
                str(marker),
                "transition" if marker == first_marker else "legacy",
            ],
            cwd=BACKEND_ROOT,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

    def wait_for_marker(
        marker: Path,
        process: subprocess.Popen[str],
    ) -> None:
        import time

        deadline = time.monotonic() + 10
        while time.monotonic() < deadline:
            if marker.exists():
                return
            if process.poll() is not None:
                stdout, stderr = process.communicate()
                raise AssertionError(
                    f"Coordinator subprocess exited {process.returncode}: "
                    f"{stdout}\n{stderr}"
                )
            time.sleep(0.01)
        raise AssertionError("Coordinator subprocess did not acquire ownership.")

    first = start_process(first_backup, first_marker)
    second: subprocess.Popen[str] | None = None
    try:
        wait_for_marker(first_marker, first)
        second = start_process(second_backup, second_marker)
        import time

        time.sleep(0.2)
        assert not second_marker.exists()
        assert not second_backup.exists()

        assert first.stdin is not None
        first.stdin.write("release\n")
        first.stdin.flush()
        first.wait(timeout=10)
        assert first.returncode == 0

        wait_for_marker(second_marker, second)
        second.wait(timeout=10)
        assert second.returncode == 0
        assert second_marker.read_text(encoding="utf-8") == "legacy-refused"
    finally:
        for process in (first, second):
            if process is not None and process.poll() is None:
                process.kill()
                process.wait(timeout=5)
