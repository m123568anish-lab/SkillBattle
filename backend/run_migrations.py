#!/usr/bin/env python
"""Apply the repository's Alembic migrations without schema bootstrapping."""

from __future__ import annotations

import argparse
import hashlib
import logging
import os
import sys
import uuid
from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import Connection, inspect, select, text
from sqlalchemy.engine import URL, make_url
from sqlalchemy.exc import ArgumentError

from app.database.database import engine
from app.core.config import settings
from app.database.migration_infrastructure.epoch_control import (
    EPOCH_AUDIT_TABLE,
    EPOCH_CONTROL_TABLE,
    EpochTransition,
    EpochTransitionState,
    create_epoch_control_schema,
    epoch_database_identity_digest as _database_identity_digest,
    epoch_control_snapshot,
    record_epoch_transition,
)
from app.database.migration_infrastructure.epoch_state import (
    assert_legacy_runner_allowed,
    classify_epoch_objects,
    CONTROL_TABLES,
    EpochObjectState,
)
from app.database.migration_diagnostics import (
    database_error_diagnostics,
    safe_traceback_frames,
)
from app.database.migration_infrastructure.migration_coordinator import (
    MaintenanceWindowVerifier,
    MigrationCoordinationError,
    PostgreSQLMigrationOwnership,
    SQLiteMigrationOwnership,
    acquire_postgresql_migration_ownership,
    acquire_sqlite_migration_ownership,
    require_supported_migration_dialect,
    postgresql_database_identity,
)
from app.database.migration_preflight import (
    compare_epoch_model_schema,
    compare_model_schema,
    epoch_target_fingerprint_digest,
)
from app.database.migration_infrastructure.schema_manifest import (
    build_schema_manifest,
    compare_schema_manifests,
    manifest_fingerprint,
)
from app.database.migration_state import (
    MigrationStateError,
    find_missing_applied_tables,
    find_pending_table_conflicts,
    inspect_migration_state,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    stream=sys.stdout,
    force=True,
)
engine.echo = False
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)


def _migration_database_url() -> URL:
    raw_url = settings.MIGRATION_DATABASE_URL.strip() or str(settings.DATABASE_URL)
    if raw_url.startswith("postgres://"):
        raw_url = raw_url.replace("postgres://", "postgresql+psycopg://", 1)
    elif raw_url.startswith("postgresql://"):
        raw_url = raw_url.replace("postgresql://", "postgresql+psycopg://", 1)
    elif raw_url.startswith("postgresql+psycopg2://"):
        raw_url = raw_url.replace(
            "postgresql+psycopg2://",
            "postgresql+psycopg://",
            1,
        )

    url = make_url(raw_url)
    if url.get_backend_name() == "postgresql" and "-pooler" in (url.host or ""):
        raise MigrationCoordinationError(
            "Schema migrations require a direct PostgreSQL connection. "
            "Set MIGRATION_DATABASE_URL to Neon's unpooled connection string."
        )
    return url


def _run_migrations_on_connection(
    connection: Connection,
    config: Config,
    script: ScriptDirectory,
    ownership: SQLiteMigrationOwnership | PostgreSQLMigrationOwnership,
    diagnostic_context: dict[str, object],
) -> int:
    config.attributes["connection"] = connection
    config.attributes["migration_ownership"] = ownership
    if isinstance(ownership, PostgreSQLMigrationOwnership):
        ownership.assert_connection(connection)
        connection.commit()
    diagnostic_context["phase"] = "epoch_state_guard"
    table_names = inspect(connection).get_table_names()
    assert_legacy_runner_allowed(table_names)
    diagnostic_context["phase"] = "revision_state_inspection"
    state = inspect_migration_state(connection, script)
    if isinstance(ownership, PostgreSQLMigrationOwnership):
        if state.current_revision is None:
            raise MigrationStateError(
                "PostgreSQL has no supported fresh-install baseline; "
                "the legacy runner will not create or stamp a schema."
            )
        connection.commit()
        connection.execute(text("SET TRANSACTION READ ONLY"))

    diagnostic_context["current_revision"] = state.current_revision
    missing_applied_tables = find_missing_applied_tables(script, state)
    if missing_applied_tables:
        details = ", ".join(missing_applied_tables[:12])
        more = len(missing_applied_tables) - min(len(missing_applied_tables), 12)
        if more:
            details += f", and {more} more"
        raise MigrationStateError(
            "Revision metadata claims migrations whose created tables are missing: "
            f"{details}"
        )
    conflicts = find_pending_table_conflicts(script, state)
    if conflicts:
        details = "; ".join(conflicts[:8])
        more = len(conflicts) - min(len(conflicts), 8)
        if more:
            details += f"; and {more} more conflict(s)"
        raise MigrationStateError(
            "Pending migrations conflict with the inspected table state: "
            f"{details}"
        )
    if state.current_revision == state.expected_head:
        diagnostic_context["phase"] = "schema_comparison"
        differences = compare_model_schema(connection)
        if differences:
            raise MigrationStateError(
                "Database is already at the repository head but differs from "
                f"the SQLAlchemy model schema ({len(differences)} difference(s)); "
                "refusing to report migration success."
            )
    logger.info(
        "MIGRATION CURRENT revision=%s tables=%d",
        state.current_revision or "<empty>",
        len(state.table_names),
    )

    connection.commit()
    diagnostic_context["phase"] = "alembic_upgrade"
    command.upgrade(config, state.expected_head)
    connection.commit()
    if isinstance(ownership, PostgreSQLMigrationOwnership):
        ownership.assert_connection(connection)
        connection.commit()
        connection.execute(text("SET TRANSACTION READ ONLY"))
    diagnostic_context["phase"] = "final_revision_validation"
    final_state = inspect_migration_state(connection, script)
    if final_state.current_revision != final_state.expected_head:
        raise MigrationStateError(
            "Alembic completed without recording the expected repository head."
        )
    differences = compare_model_schema(connection)
    if differences:
        raise MigrationStateError(
            "The database differs from the SQLAlchemy model schema after migration "
            f"({len(differences)} difference(s)); refusing to report migration success."
        )
    connection.commit()
    if isinstance(ownership, PostgreSQLMigrationOwnership):
        ownership.assert_connection(connection)
        connection.commit()
    logger.info("MIGRATION COMPLETED revision=%s", final_state.expected_head)
    return 0


def _is_authorized_disposable_postgresql(url: URL) -> bool:
    loopback_hosts = {"127.0.0.1", "localhost", "::1"}
    if (
        url.get_backend_name() != "postgresql"
        or url.host not in loopback_hosts
        or not (url.database or "").startswith("qubira_test_")
        or os.environ.get("QUBIRA_EPOCH_POSTGRESQL_TEST") != "1"
        or os.environ.get("QUBIRA_TEST_MODE") != "1"
        or str(settings.ENVIRONMENT).lower() != "test"
    ):
        return False
    test_url = os.environ.get("QUBIRA_TEST_POSTGRESQL_URL", "")
    if not test_url:
        return False
    try:
        return postgresql_database_identity(make_url(test_url)) == (
            (url.host or "").lower(),
            url.port or 5432,
            url.database or "",
            url.username or "",
        )
    except ArgumentError:
        return False


def _assert_disposable_postgresql_server(
    connection: Connection,
    ownership: PostgreSQLMigrationOwnership,
) -> None:
    ownership.assert_connection(connection)
    version = int(connection.exec_driver_sql("SHOW server_version_num").scalar_one())
    listen_addresses = connection.exec_driver_sql(
        "SHOW listen_addresses"
    ).scalar_one()
    schema = connection.exec_driver_sql("SELECT current_schema()").scalar_one()
    if (
        version != 180006
        or "127.0.0.1" not in listen_addresses.split(",")
        or schema != "public"
    ):
        raise MigrationCoordinationError(
            "Epoch execution requires the verified loopback PostgreSQL 18.6 public-schema test server."
        )
    connection.commit()


def _epoch_plan_digest(script_directory: Path) -> str:
    version_files = sorted((script_directory / "versions").glob("*.py"))
    if not version_files:
        raise MigrationStateError("The epoch lineage has no reviewed baseline revision.")
    digest = hashlib.sha256()
    for path in version_files:
        digest.update(path.name.encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def _epoch_database_identity_digest(ownership: PostgreSQLMigrationOwnership) -> str:
    return _database_identity_digest(ownership.connection)


def _epoch_transition(
    connection: Connection,
    expected_state: EpochTransitionState,
    target_state: EpochTransitionState,
    **metadata: str | None,
) -> None:
    record_epoch_transition(
        connection,
        expected_state,
        EpochTransition(
            to_state=target_state,
            idempotency_key=f"{target_state.value}-{uuid.uuid4().hex}",
            actor_role="migration_runner",
            **metadata,
        ),
    )
    connection.commit()


def _read_epoch_state(connection: Connection) -> EpochTransitionState:
    control = connection.execute(
        select(EPOCH_CONTROL_TABLE).where(EPOCH_CONTROL_TABLE.c.singleton_id == 1)
    ).mappings().one_or_none()
    audit_count = connection.execute(
        select(EPOCH_AUDIT_TABLE.c.event_id).limit(1)
    ).first()
    if control is None and audit_count is None:
        return EpochTransitionState.UNCLASSIFIED
    return epoch_control_snapshot(connection)["state"]


def _verify_epoch_database(
    connection: Connection,
    ownership: PostgreSQLMigrationOwnership,
    script: ScriptDirectory,
    target_fingerprint_digest: str,
    plan_digest: str,
) -> str:
    ownership.assert_connection(connection)
    connection.commit()
    connection.execute(text("SET TRANSACTION READ ONLY"))
    snapshot = epoch_control_snapshot(connection)
    if snapshot["state"] not in {
        EpochTransitionState.COMMITTED_UNVERIFIED,
        EpochTransitionState.VERIFIED,
    }:
        raise MigrationStateError(
            f"Epoch state {snapshot['state'].value!r} cannot pass verification."
        )
    if (
        snapshot["database_identity_digest"]
        != _epoch_database_identity_digest(ownership)
        or snapshot["plan_digest"] != plan_digest
        or snapshot["target_fingerprint_digest"] != target_fingerprint_digest
    ):
        raise MigrationStateError(
            "Epoch verification is not bound to the current database, plan, and target."
        )
    names = set(inspect(connection).get_table_names())
    if "alembic_version" in names:
        raise MigrationStateError(
            "Legacy and epoch version state is mixed; refusing epoch verification."
        )
    if "alembic_version_epoch" not in names:
        raise MigrationStateError("The epoch version table is missing.")
    revisions = connection.execute(
        text("SELECT version_num FROM alembic_version_epoch")
    ).scalars().all()
    heads = script.get_heads()
    if len(heads) != 1 or revisions != [heads[0]]:
        raise MigrationStateError(
            f"Expected exactly one epoch revision at {heads}; found {revisions}."
        )
    differences = compare_epoch_model_schema(connection)
    if differences:
        raise MigrationStateError(
            "The epoch database differs from its registered model schema "
            f"({len(differences)} difference(s))."
        )
    manifest = build_schema_manifest(connection)
    if manifest_fingerprint(manifest) != manifest["sha256"]:
        raise MigrationStateError("The epoch schema manifest fingerprint is invalid.")
    if epoch_target_fingerprint_digest() != target_fingerprint_digest:
        raise MigrationStateError("The epoch target DDL contract has changed.")
    connection.commit()
    ownership.assert_connection(connection)
    return revisions[0]


def _ensure_epoch_preflight_is_fresh(connection: Connection) -> str:
    names = set(inspect(connection).get_table_names())
    if "alembic_version" in names or "alembic_version_epoch" in names:
        raise MigrationStateError("A fresh epoch install cannot adopt version state.")
    unexpected_tables = names - set(CONTROL_TABLES)
    manifest = build_schema_manifest(connection)
    unexpected_sections = {
        "views",
        "materialized_views",
        "materialized_view_indexes",
        "types",
        "policies",
        "row_security",
        "partitioned_tables",
        "partitions",
        "cross_schema_foreign_keys",
    }
    has_unexpected_objects = any(manifest.get(section) for section in unexpected_sections)
    allowed_triggers = {
        "qubira_epoch_audit_no_update",
        "qubira_epoch_audit_no_delete",
        "qubira_epoch_audit_no_update_delete",
    }
    allowed_routines = {"qubira_reject_epoch_audit_mutation()"}
    allowed_sequences = {"qubira_epoch_audit_event_id_seq"}
    has_unexpected_objects = has_unexpected_objects or any(
        trigger["name"] not in allowed_triggers
        for trigger in manifest.get("triggers", [])
    )
    has_unexpected_objects = has_unexpected_objects or any(
        routine["name"] not in allowed_routines
        for routine in manifest.get("routines", [])
    )
    has_unexpected_objects = has_unexpected_objects or any(
        sequence["name"] not in allowed_sequences
        for sequence in manifest.get("sequences", [])
    )
    if unexpected_tables or has_unexpected_objects:
        unexpected_details = {
            section: len(manifest.get(section, []))
            for section in unexpected_sections
            if manifest.get(section)
        }
        unexpected_details.update(
            {
                "triggers": [
                    trigger["name"]
                    for trigger in manifest.get("triggers", [])
                    if trigger["name"] not in allowed_triggers
                ],
                "routines": [
                    routine["name"]
                    for routine in manifest.get("routines", [])
                    if routine["name"] not in allowed_routines
                ],
                "sequences": [
                    sequence["name"]
                    for sequence in manifest.get("sequences", [])
                    if sequence["name"] not in allowed_sequences
                ],
            }
        )
        raise MigrationStateError(
            "A fresh epoch install requires an empty application schema; "
            f"existing-schema adoption is blocked (tables={sorted(unexpected_tables)}, "
            f"catalog_objects={unexpected_details})."
        )
    manifest["tables"] = [
        table for table in manifest["tables"] if table["name"] not in CONTROL_TABLES
    ]
    manifest["triggers"] = [
        trigger
        for trigger in manifest["triggers"]
        if trigger["name"] not in allowed_triggers
    ]
    manifest["routines"] = [
        routine
        for routine in manifest["routines"]
        if routine["name"] not in allowed_routines
    ]
    manifest["sequences"] = [
        sequence
        for sequence in manifest["sequences"]
        if sequence["name"] not in allowed_sequences
    ]
    manifest.pop("object_ownership", None)
    manifest.pop("privileges", None)
    manifest.pop("sha256", None)
    return manifest_fingerprint(manifest)


def _run_epoch_migrations_on_connection(
    connection: Connection,
    ownership: PostgreSQLMigrationOwnership,
) -> int:
    config = Config(str(Path(__file__).with_name("alembic_epoch.ini")))
    script = ScriptDirectory.from_config(config)
    heads = script.get_heads()
    if len(heads) != 1:
        raise MigrationStateError(
            f"The epoch lineage must have exactly one head; found {heads}."
        )
    target_revision = heads[0]
    target_fingerprint = epoch_target_fingerprint_digest()
    plan_digest = _epoch_plan_digest(Path(config.get_main_option("script_location")))
    identity_digest = _epoch_database_identity_digest(ownership)

    ownership.assert_connection(connection)
    names = set(inspect(connection).get_table_names())
    if "alembic_version" in names:
        raise MigrationStateError(
            "The legacy PostgreSQL lineage is not enabled for epoch execution."
        )
    object_state = classify_epoch_objects(names)
    if object_state is EpochObjectState.ABSENT:
        source_fingerprint = _ensure_epoch_preflight_is_fresh(connection)
        create_epoch_control_schema(connection)
        connection.commit()
        object_state = EpochObjectState.CONTROL_BOOTSTRAPPED
    elif object_state not in {
        EpochObjectState.CONTROL_BOOTSTRAPPED,
        EpochObjectState.COMPLETE,
    }:
        raise MigrationStateError(
            "The epoch database objects are incomplete; manual inspection is required."
        )

    state = _read_epoch_state(connection)
    if object_state is EpochObjectState.COMPLETE:
        if state is EpochTransitionState.VERIFIED:
            _verify_epoch_database(
                connection,
                ownership,
                script,
                target_fingerprint,
                plan_digest,
            )
            logger.info("EPOCH MIGRATION ALREADY VERIFIED revision=%s", target_revision)
            return 0
        if state in {
            EpochTransitionState.STARTED,
            EpochTransitionState.APPLYING,
            EpochTransitionState.COMMITTED_UNVERIFIED,
        }:
            _epoch_transition(
                connection,
                state,
                EpochTransitionState.RECOVERY_REQUIRED,
            )
            raise MigrationStateError(
                f"Interrupted epoch state {state.value!r} requires explicit recovery."
            )
        raise MigrationStateError(
            "Epoch version state exists without a verified transition; recovery is required."
        )

    if state in {
        EpochTransitionState.STARTED,
        EpochTransitionState.APPLYING,
        EpochTransitionState.COMMITTED_UNVERIFIED,
    }:
        _epoch_transition(
            connection,
            state,
            EpochTransitionState.RECOVERY_REQUIRED,
        )
        raise MigrationStateError(
            f"Interrupted epoch state {state.value!r} requires explicit recovery."
        )
    if state in {
        EpochTransitionState.RECOVERY_REQUIRED,
        EpochTransitionState.REFUSED,
        EpochTransitionState.ADOPTION_PREFLIGHT,
    }:
        raise MigrationStateError(
            f"Epoch state {state.value!r} cannot be retried automatically."
        )
    if state is EpochTransitionState.VERIFIED:
        raise MigrationStateError(
            "Epoch control reports verified state without an epoch version table."
        )

    else:
        try:
            source_fingerprint = _ensure_epoch_preflight_is_fresh(connection)
        except MigrationStateError:
            if state in {
                EpochTransitionState.UNCLASSIFIED,
                EpochTransitionState.FRESH_PREFLIGHT,
            }:
                _epoch_transition(
                    connection,
                    state,
                    EpochTransitionState.REFUSED,
                )
            raise
    if state is EpochTransitionState.UNCLASSIFIED:
        _epoch_transition(
            connection,
            state,
            EpochTransitionState.FRESH_PREFLIGHT,
            source_fingerprint_digest=source_fingerprint,
        )
        state = EpochTransitionState.FRESH_PREFLIGHT
    elif state is EpochTransitionState.FRESH_PREFLIGHT:
        snapshot = epoch_control_snapshot(connection)
        if snapshot["source_fingerprint_digest"] != source_fingerprint:
            _epoch_transition(
                connection,
                state,
                EpochTransitionState.REFUSED,
            )
            raise MigrationStateError(
                "The epoch source fingerprint changed after durable preflight."
            )
    elif state is not EpochTransitionState.FRESH_PREFLIGHT:
        raise MigrationStateError(f"Unsupported epoch state {state.value!r}.")

    if state is EpochTransitionState.FRESH_PREFLIGHT:
        _epoch_transition(
            connection,
            state,
            EpochTransitionState.STARTED,
            plan_digest=plan_digest,
            target_fingerprint_digest=target_fingerprint,
            database_identity_digest=identity_digest,
        )

    try:
        _epoch_transition(
            connection,
            EpochTransitionState.STARTED,
            EpochTransitionState.APPLYING,
        )
        config.set_main_option(
            "sqlalchemy.url",
            str(connection.engine.url).replace("%", "%%"),
        )
        config.attributes["connection"] = connection
        config.attributes["migration_ownership"] = ownership
        config.attributes["coordinated_runner"] = True
        command.upgrade(config, target_revision)
        connection.commit()
        ownership.assert_connection(connection)
        _epoch_transition(
            connection,
            EpochTransitionState.APPLYING,
            EpochTransitionState.COMMITTED_UNVERIFIED,
        )
        _verify_epoch_database(
            connection,
            ownership,
            script,
            target_fingerprint,
            plan_digest,
        )
        _epoch_transition(
            connection,
            EpochTransitionState.COMMITTED_UNVERIFIED,
            EpochTransitionState.VERIFIED,
        )
        logger.info("EPOCH MIGRATION VERIFIED revision=%s", target_revision)
        return 0
    except Exception as migration_error:
        if not connection.invalidated:
            try:
                if connection.in_transaction():
                    connection.rollback()
                current_state = _read_epoch_state(connection)
                if current_state in {
                    EpochTransitionState.STARTED,
                    EpochTransitionState.APPLYING,
                    EpochTransitionState.COMMITTED_UNVERIFIED,
                }:
                    _epoch_transition(
                        connection,
                        current_state,
                        EpochTransitionState.RECOVERY_REQUIRED,
                    )
            except Exception as recovery_error:
                logger.error(
                    "EPOCH RECOVERY MARKER FAILED migration_error=%s recovery_error=%s",
                    type(migration_error).__name__,
                    type(recovery_error).__name__,
                )
                raise MigrationCoordinationError(
                    "Epoch migration outcome is uncertain and durable recovery state "
                    "could not be recorded."
                ) from recovery_error
        raise


def run_migrations(
    maintenance_verifier: MaintenanceWindowVerifier | None = None,
    backup_path: str | Path | None = None,
) -> int:
    config = Config(str(Path(__file__).with_name("alembic.ini")))
    script = ScriptDirectory.from_config(config)
    logger.info(
        "MIGRATION TARGET heads=%s database_dialect=%s",
        script.get_heads(),
        engine.dialect.name,
    )
    diagnostic_context: dict[str, object] = {
        "phase": "dialect_gate",
        "current_revision": None,
        "sqlalchemy_transaction_active": None,
    }
    heads = script.get_heads()
    target_revision = heads[0] if len(heads) == 1 else None

    try:
        if engine.dialect.name == "postgresql":
            migration_url = _migration_database_url()
            disposable_postgresql_test = _is_authorized_disposable_postgresql(
                migration_url
            )
            require_supported_migration_dialect(
                engine.dialect.name,
                allow_postgresql_for_disposable_test=disposable_postgresql_test,
            )
        else:
            require_supported_migration_dialect(engine.dialect.name)
        diagnostic_context["phase"] = "ownership_acquisition"
        if engine.dialect.name == "sqlite":
            ownership_context = acquire_sqlite_migration_ownership(
                engine,
                maintenance_verifier,
                backup_path,
            )
        else:
            ownership_context = acquire_postgresql_migration_ownership(migration_url)
        with ownership_context as ownership:
            try:
                if isinstance(ownership, PostgreSQLMigrationOwnership):
                    if not disposable_postgresql_test:
                        raise MigrationCoordinationError(
                            "PostgreSQL migration execution remains disabled outside "
                            "the explicit disposable test mode."
                        )
                    _assert_disposable_postgresql_server(
                        ownership.connection,
                        ownership,
                    )
                    diagnostic_context["phase"] = "lineage_dispatch"
                    return _run_epoch_migrations_on_connection(
                        ownership.connection,
                        ownership,
                    )
                return _run_migrations_on_connection(
                    ownership.connection,
                    config,
                    script,
                    ownership,
                    diagnostic_context,
                )
            except Exception:
                diagnostic_context["sqlalchemy_transaction_active"] = (
                    ownership.connection.in_transaction()
                )
                raise
    except Exception as exc:
        database_diagnostics = database_error_diagnostics(exc)
        detail = (
            str(exc)
            if isinstance(exc, (MigrationStateError, MigrationCoordinationError))
            else "database operation failed"
        )
        logger.error(
            "MIGRATION FAILED phase=%s current_revision=%s target_revision=%s "
            "error_type=%s driver_error_type=%s sqlstate=%s "
            "sqlalchemy_transaction_active=%s statement=%s "
            "traceback_frames=%s detail=%s",
            diagnostic_context["phase"],
            diagnostic_context["current_revision"],
            target_revision,
            database_diagnostics["sqlalchemy_error_type"],
            database_diagnostics["driver_error_type"],
            database_diagnostics["sqlstate"],
            diagnostic_context["sqlalchemy_transaction_active"],
            database_diagnostics["statement"],
            safe_traceback_frames(exc),
            detail,
        )
        return 1


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Deliberately invoke the coordinated migration operation.",
    )
    args = parser.parse_args(argv)
    if not args.execute:
        logger.error(
            "Migration execution requires explicit --execute; API service "
            "startup must not invoke this command."
        )
        return 2
    return run_migrations()


if __name__ == "__main__":
    raise SystemExit(main())
