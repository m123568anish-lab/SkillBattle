from __future__ import annotations

import logging.config
import os

from alembic import context
from alembic.script import ScriptDirectory

from app.database.migration_infrastructure.sqlite_lock import (
    canonical_database_path,
)


config = context.config
if config.config_file_name is not None:
    logging.config.fileConfig(config.config_file_name)

if os.environ.get("QUBIRA_EPOCH_SCAFFOLD_ACTIVE") != "1":
    raise RuntimeError(
        "The schema epoch is an inactive scaffold. Set "
        "QUBIRA_EPOCH_SCAFFOLD_ACTIVE=1 only for explicitly authorized work."
    )

if not ScriptDirectory.from_config(config).get_heads():
    raise RuntimeError(
        "The schema epoch has no revisions and cannot execute migrations."
    )

database_url = os.environ.get("QUBIRA_EPOCH_DATABASE_URL")
if not database_url:
    raise RuntimeError(
        "QUBIRA_EPOCH_DATABASE_URL must be explicitly provided for scaffold operations."
    )
config.set_main_option("sqlalchemy.url", database_url.replace("%", "%%"))


def run_migrations_offline() -> None:
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=None,
        literal_binds=True,
        version_table=config.get_main_option("version_table"),
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connection = config.attributes.get("connection")
    ownership = config.attributes.get("migration_ownership")
    if (
        connection is None
        or ownership is None
        or connection is not getattr(ownership, "connection", None)
        or not getattr(ownership, "is_active", False)
    ):
        raise RuntimeError(
            "Epoch Alembic execution requires an active migration ownership lease."
        )
    if connection.dialect.name != "sqlite":
        raise RuntimeError(
            "PostgreSQL epoch coordination is blocked until advisory-lock "
            "implementation and disposable-server tests are available."
        )
    configured_database = connection.engine.url.database
    if (
        configured_database is None
        or canonical_database_path(configured_database)
        != getattr(ownership, "database_path", None)
    ):
        raise RuntimeError(
            "Epoch migration ownership does not match the connected database."
        )

    context.configure(
        connection=connection,
        target_metadata=None,
        version_table=config.get_main_option("version_table"),
    )
    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
