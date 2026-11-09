from __future__ import annotations

import logging.config

from alembic import context
from sqlalchemy.engine import make_url
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.database.migration_infrastructure.epoch_control import EPOCH_CONTROL_TABLE
from app.database.migration_infrastructure.migration_coordinator import (
    PostgreSQLMigrationOwnership,
    postgresql_database_identity,
)
from app.models import Base


config = context.config
if config.config_file_name is not None:
    logging.config.fileConfig(config.config_file_name, disable_existing_loggers=False)


def _configured_database_url():
    raw_url = settings.MIGRATION_DATABASE_URL.strip() or str(settings.DATABASE_URL)
    if raw_url.startswith("postgres://"):
        raw_url = raw_url.replace("postgres://", "postgresql+psycopg://", 1)
    elif raw_url.startswith("postgresql://"):
        raw_url = raw_url.replace("postgresql://", "postgresql+psycopg://", 1)
    return make_url(raw_url)


def run_migrations_offline() -> None:
    raise RuntimeError(
        "Offline epoch Alembic execution is blocked; use the coordinated runner."
    )


def run_migrations_online() -> None:
    connection = config.attributes.get("connection")
    ownership = config.attributes.get("migration_ownership")
    if (
        config.attributes.get("coordinated_runner") is not True
        or connection is None
        or not isinstance(ownership, PostgreSQLMigrationOwnership)
        or connection is not ownership.connection
        or not ownership.is_active
        or not isinstance(connection.engine.pool, NullPool)
    ):
        raise RuntimeError(
            "Epoch Alembic execution requires the active coordinated PostgreSQL lease."
        )

    configured_url = _configured_database_url()
    if (
        configured_url.get_backend_name() != "postgresql"
        or postgresql_database_identity(connection.engine.url)
        != ownership.database_identity
        or postgresql_database_identity(configured_url)
        != ownership.database_identity
    ):
        raise RuntimeError(
            "Epoch Alembic execution is not using the configured owned database."
        )
    ownership.assert_connection(connection)

    context.configure(
        connection=connection,
        target_metadata=[Base.metadata, EPOCH_CONTROL_TABLE.metadata],
        compare_type=True,
        version_table=config.get_main_option("version_table"),
        transaction_per_migration=True,
    )
    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
