from __future__ import annotations

import hashlib
import json
import os
import sqlite3
from collections.abc import Iterator
from contextlib import closing, contextmanager
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Protocol

from sqlalchemy import Connection, Engine

from app.database.migration_infrastructure.sqlite_lock import (
    SQLiteFileLock,
    assert_database_identity_supported,
)


class MigrationCoordinationError(RuntimeError):
    """Raised when a safe SQLite maintenance window cannot be established."""


def require_supported_migration_dialect(dialect_name: str) -> None:
    if dialect_name != "sqlite":
        raise MigrationCoordinationError(
            f"Migration execution is blocked for {dialect_name!r} until its "
            "ownership mechanism is implemented and validated."
        )


@dataclass(frozen=True)
class MaintenanceWindowEvidence:
    database_identity: str
    evidence_id: str
    issued_at: datetime
    application_processes_stopped: bool
    worker_processes_stopped: bool
    sync_pools_disposed: bool
    async_pools_disposed: bool
    background_tasks_stopped: bool
    scheduled_jobs_stopped: bool
    raw_connections_closed: bool
    external_access_controlled: bool


class MaintenanceWindowVerifier(Protocol):
    def verify(self, database_path: Path) -> MaintenanceWindowEvidence: ...


@dataclass(frozen=True)
class SQLiteBackupReceipt:
    database_identity: str
    backup_path: Path
    sha256: str
    schema_fingerprint: str
    table_row_counts: tuple[tuple[str, int], ...]
    page_count: int
    integrity_check: str
    foreign_key_violations: int


@dataclass
class SQLiteMigrationOwnership:
    database_path: Path
    connection: Connection
    backup: SQLiteBackupReceipt
    _active: bool = True

    @property
    def is_active(self) -> bool:
        return self._active


def _validate_maintenance_evidence(
    evidence: MaintenanceWindowEvidence,
    database_path: Path,
    *,
    now: datetime | None = None,
) -> None:
    if not isinstance(evidence, MaintenanceWindowEvidence):
        raise MigrationCoordinationError(
            "The maintenance-window verifier returned invalid evidence."
        )
    if not evidence.evidence_id.strip():
        raise MigrationCoordinationError(
            "Maintenance-window evidence must include a non-empty evidence ID."
        )
    expected_identity = os.path.normcase(str(database_path))
    if os.path.normcase(evidence.database_identity) != expected_identity:
        raise MigrationCoordinationError(
            "Maintenance-window evidence targets a different database identity."
        )
    if evidence.issued_at.tzinfo is None:
        raise MigrationCoordinationError(
            "Maintenance-window evidence timestamp must include a timezone."
        )
    current_time = now or datetime.now(timezone.utc)
    if evidence.issued_at > current_time + timedelta(seconds=30):
        raise MigrationCoordinationError(
            "Maintenance-window evidence timestamp is in the future."
        )
    if current_time - evidence.issued_at > timedelta(minutes=5):
        raise MigrationCoordinationError(
            "Maintenance-window evidence is older than five minutes."
        )

    required_checks = (
        evidence.application_processes_stopped,
        evidence.worker_processes_stopped,
        evidence.sync_pools_disposed,
        evidence.async_pools_disposed,
        evidence.background_tasks_stopped,
        evidence.scheduled_jobs_stopped,
        evidence.raw_connections_closed,
        evidence.external_access_controlled,
    )
    if not all(required_checks):
        raise MigrationCoordinationError(
            "Maintenance window is incomplete; all application, worker, pool, "
            "task, raw-connection, and external-access checks must pass."
        )


def _sqlite_schema_and_counts(
    connection: sqlite3.Connection,
) -> tuple[str, tuple[tuple[str, int], ...]]:
    schema = connection.execute(
        "SELECT type, name, tbl_name, sql FROM sqlite_master "
        "WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name, tbl_name"
    ).fetchall()
    schema_json = json.dumps(schema, ensure_ascii=True, separators=(",", ":"))
    fingerprint = hashlib.sha256(schema_json.encode("utf-8")).hexdigest()

    tables = connection.execute(
        "SELECT name FROM sqlite_master "
        "WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).fetchall()
    counts: list[tuple[str, int]] = []
    for (table_name,) in tables:
        escaped_name = table_name.replace('"', '""')
        row_count = connection.execute(
            f'SELECT COUNT(*) FROM "{escaped_name}"'
        ).fetchone()[0]
        counts.append((table_name, int(row_count)))
    return fingerprint, tuple(counts)


def _sqlalchemy_schema_and_counts(
    connection: Connection,
) -> tuple[str, tuple[tuple[str, int], ...]]:
    schema = [
        tuple(row)
        for row in connection.exec_driver_sql(
            "SELECT type, name, tbl_name, sql FROM sqlite_master "
            "WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name, tbl_name"
        ).all()
    ]
    schema_json = json.dumps(schema, ensure_ascii=True, separators=(",", ":"))
    fingerprint = hashlib.sha256(schema_json.encode("utf-8")).hexdigest()

    tables = connection.exec_driver_sql(
        "SELECT name FROM sqlite_master "
        "WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).scalars().all()
    counts: list[tuple[str, int]] = []
    for table_name in tables:
        escaped_name = table_name.replace('"', '""')
        row_count = connection.exec_driver_sql(
            f'SELECT COUNT(*) FROM "{escaped_name}"'
        ).scalar_one()
        counts.append((table_name, int(row_count)))
    return fingerprint, tuple(counts)


def _verify_live_database_matches_backup(
    connection: Connection,
    backup: SQLiteBackupReceipt,
) -> None:
    integrity_check = connection.exec_driver_sql("PRAGMA integrity_check").scalar_one()
    foreign_key_violations = connection.exec_driver_sql(
        "PRAGMA foreign_key_check"
    ).all()
    schema_fingerprint, row_counts = _sqlalchemy_schema_and_counts(connection)
    if (
        integrity_check != backup.integrity_check
        or foreign_key_violations
        or schema_fingerprint != backup.schema_fingerprint
        or row_counts != backup.table_row_counts
    ):
        raise MigrationCoordinationError(
            "The live SQLite database differs from its verified pre-migration backup."
        )


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as backup_file:
        for chunk in iter(lambda: backup_file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def create_verified_sqlite_backup(
    database_path: str | os.PathLike[str],
    backup_path: str | os.PathLike[str],
) -> SQLiteBackupReceipt:
    """Create a new, non-overwriting SQLite snapshot and verify its contents."""
    canonical_database = assert_database_identity_supported(database_path)
    canonical_backup = assert_database_identity_supported(backup_path)
    if canonical_database == canonical_backup:
        raise MigrationCoordinationError(
            "The backup path must be different from the database path."
        )
    if not canonical_backup.parent.is_dir():
        raise FileNotFoundError(
            f"Backup directory does not exist: {canonical_backup.parent}"
        )
    if canonical_backup.exists():
        raise FileExistsError(
            f"Refusing to overwrite an existing backup: {canonical_backup}"
        )
    if not canonical_database.parent.is_dir():
        raise FileNotFoundError(
            f"SQLite database directory does not exist: {canonical_database.parent}"
        )

    descriptor = os.open(
        canonical_backup,
        os.O_CREAT | os.O_EXCL | os.O_RDWR,
        0o600,
    )
    os.close(descriptor)
    assert_database_identity_supported(canonical_backup)

    if canonical_database.exists():
        source_uri = f"{canonical_database.as_uri()}?mode=ro"
        with closing(sqlite3.connect(source_uri, uri=True, timeout=5)) as source:
            source.execute("PRAGMA query_only = ON")
            with closing(sqlite3.connect(canonical_backup, timeout=5)) as destination:
                source.backup(destination, pages=128, sleep=0.05)
    else:
        with closing(sqlite3.connect(canonical_backup, timeout=5)):
            pass

    with closing(
        sqlite3.connect(
            f"{canonical_backup.as_uri()}?mode=ro",
            uri=True,
            timeout=5,
        )
    ) as backup:
        backup.execute("PRAGMA query_only = ON")
        integrity_check = backup.execute("PRAGMA integrity_check").fetchone()[0]
        if integrity_check != "ok":
            raise MigrationCoordinationError(
                "The SQLite backup failed its integrity check."
            )
        foreign_key_violations = len(
            backup.execute("PRAGMA foreign_key_check").fetchall()
        )
        if foreign_key_violations:
            raise MigrationCoordinationError(
                "The SQLite backup contains foreign-key violations."
            )
        schema_fingerprint, row_counts = _sqlite_schema_and_counts(backup)
        page_count = int(backup.execute("PRAGMA page_count").fetchone()[0])

    return SQLiteBackupReceipt(
        database_identity=os.path.normcase(str(canonical_database)),
        backup_path=canonical_backup,
        sha256=_sha256_file(canonical_backup),
        schema_fingerprint=schema_fingerprint,
        table_row_counts=row_counts,
        page_count=page_count,
        integrity_check=integrity_check,
        foreign_key_violations=foreign_key_violations,
    )


@contextmanager
def acquire_sqlite_migration_ownership(
    engine: Engine,
    verifier: MaintenanceWindowVerifier | None,
    backup_path: str | os.PathLike[str] | None,
    *,
    timeout: float = 60.0,
) -> Iterator[SQLiteMigrationOwnership]:
    """Hold exclusive local SQLite ownership through Alembic and validation.

    A verifier must be supplied by a trusted host/process orchestrator. The
    sidecar lock is cooperative and does not stop non-cooperating SQLite users.
    """
    if engine.dialect.name != "sqlite":
        raise MigrationCoordinationError(
            "This coordinator supports only file-backed SQLite; PostgreSQL "
            "coordination is not implemented."
        )
    database_url = engine.url.database
    if database_url is None:
        raise MigrationCoordinationError(
            "Migration coordination requires a file-backed SQLite database."
        )
    if verifier is None:
        raise MigrationCoordinationError(
            "No trusted maintenance-window verifier is configured; refusing migration."
        )
    if backup_path is None:
        raise MigrationCoordinationError(
            "A new verified SQLite backup path is required before migration."
        )

    database_path = assert_database_identity_supported(database_url)
    lock = SQLiteFileLock(database_path, "exclusive", timeout=timeout)
    with lock:
        database_path = assert_database_identity_supported(database_path)
        evidence = verifier.verify(database_path)
        _validate_maintenance_evidence(evidence, database_path)
        backup = create_verified_sqlite_backup(database_path, backup_path)
        engine.dispose()
        connection = engine.connect()
        try:
            if assert_database_identity_supported(database_path) != database_path:
                raise MigrationCoordinationError(
                    "The SQLite database identity changed after connection acquisition."
                )
            _verify_live_database_matches_backup(connection, backup)
        except BaseException:
            try:
                connection.close()
            finally:
                engine.dispose()
            raise
        ownership = SQLiteMigrationOwnership(
            database_path=database_path,
            connection=connection,
            backup=backup,
        )
        try:
            yield ownership
        finally:
            ownership._active = False
            try:
                connection.close()
            finally:
                engine.dispose()
