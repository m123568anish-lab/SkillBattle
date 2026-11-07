#!/usr/bin/env python
"""Apply the repository's Alembic migrations without schema bootstrapping."""

from __future__ import annotations

import logging
import sys
from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import inspect

from app.database.database import engine
from app.database.migration_infrastructure.epoch_state import (
    assert_legacy_runner_allowed,
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


def run_migrations() -> int:
    config = Config(str(Path(__file__).with_name("alembic.ini")))
    script = ScriptDirectory.from_config(config)
    logger.info(
        "MIGRATION TARGET heads=%s database_dialect=%s",
        script.get_heads(),
        engine.dialect.name,
    )

    try:
        with engine.connect() as connection:
            assert_legacy_runner_allowed(
                inspect(connection).get_table_names()
            )
            state = inspect_migration_state(connection, script)
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

        command.upgrade(config, state.expected_head)

        with engine.connect() as connection:
            final_state = inspect_migration_state(connection, script)
        if final_state.current_revision != final_state.expected_head:
            raise MigrationStateError(
                "Alembic completed without recording the expected repository head."
            )
        logger.info("MIGRATION COMPLETED revision=%s", final_state.expected_head)
        return 0
    except Exception as exc:
        # Do not log exception strings or tracebacks from database drivers:
        # they may include connection URLs or server-provided sensitive text.
        logger.error(
            "MIGRATION FAILED error_type=%s detail=%s",
            type(exc).__name__,
            str(exc) if isinstance(exc, MigrationStateError) else "database operation failed",
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(run_migrations())
