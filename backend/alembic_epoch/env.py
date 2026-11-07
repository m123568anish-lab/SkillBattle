from __future__ import annotations

import logging.config
import os

from alembic import context
from sqlalchemy import engine_from_config, pool


config = context.config
if config.config_file_name is not None:
    logging.config.fileConfig(config.config_file_name)

if os.environ.get("QUBIRA_EPOCH_SCAFFOLD_ACTIVE") != "1":
    raise RuntimeError(
        "The schema epoch is an inactive scaffold. Set "
        "QUBIRA_EPOCH_SCAFFOLD_ACTIVE=1 only for explicitly authorized work."
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
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
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
