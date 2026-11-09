#!/usr/bin/env python
"""Apply the repository's Alembic migrations without schema bootstrapping."""

from __future__ import annotations

import logging
import sys
from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import Connection, inspect

from app.database.database import engine
from app.database.migration_infrastructure.epoch_state import (
    assert_legacy_runner_allowed,
)
from app.database.migration_diagnostics import (
    database_error_diagnostics,
    safe_traceback_frames,
)
from app.database.migration_infrastructure.migration_coordinator import (
    MaintenanceWindowVerifier,
    MigrationCoordinationError,
    SQLiteMigrationOwnership,
    acquire_sqlite_migration_ownership,
    require_supported_migration_dialect,
)
from app.database.migration_preflight import compare_model_schema
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


def _run_migrations_on_connection(
    connection: Connection,
    config: Config,
    script: ScriptDirectory,
    ownership: SQLiteMigrationOwnership,
    diagnostic_context: dict[str, object],
) -> int:
    config.attributes["connection"] = connection
    config.attributes["migration_ownership"] = ownership
    diagnostic_context["phase"] = "epoch_state_guard"
    assert_legacy_runner_allowed(inspect(connection).get_table_names())
    diagnostic_context["phase"] = "revision_state_inspection"
    state = inspect_migration_state(connection, script)
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
    diagnostic_context["phase"] = "final_revision_validation"
    final_state = inspect_migration_state(connection, script)
    if final_state.current_revision != final_state.expected_head:
        raise MigrationStateError(
            "Alembic completed without recording the expected repository head."
        )
    connection.commit()
    logger.info("MIGRATION COMPLETED revision=%s", final_state.expected_head)
    return 0


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
        require_supported_migration_dialect(engine.dialect.name)
        diagnostic_context["phase"] = "ownership_acquisition"
        with acquire_sqlite_migration_ownership(
            engine,
            maintenance_verifier,
            backup_path,
        ) as ownership:
            try:
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


if __name__ == "__main__":
    raise SystemExit(run_migrations())
