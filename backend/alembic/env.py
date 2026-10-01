from __future__ import annotations

import logging
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# ---------------------------------------------------------
# Import SQLAlchemy Base
# ---------------------------------------------------------

from app.models import Base
from app.modules.audit.model import AuditLog
from app.database.database import engine as application_engine

# ---------------------------------------------------------
# ---------------------------------------------------------

config = context.config

# ---------------------------------------------------------
# Use the application's resolved sync URL so Alembic and FastAPI target the same
# absolute SQLite file or PostgreSQL database.
# ---------------------------------------------------------

database_url = application_engine.url.render_as_string(hide_password=False)
database_url = database_url.replace("%", "%%")

config.set_main_option(
    "sqlalchemy.url",
    database_url,
)

# ---------------------------------------------------------

if config.config_file_name is not None:
    fileConfig(config.config_file_name, disable_existing_loggers=False)
    logging.getLogger("__main__").setLevel(logging.INFO)

# ---------------------------------------------------------

target_metadata = Base.metadata

# ---------------------------------------------------------


def run_migrations_offline() -> None:
    """Run migrations in offline mode."""

    url = config.get_main_option("sqlalchemy.url")

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


# ---------------------------------------------------------


def run_migrations_online() -> None:
    """Run migrations in online mode."""

    connectable = engine_from_config(
        config.get_section(
            config.config_ini_section,
            {},
        ),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            render_as_batch=True,
        )

        with context.begin_transaction():
            context.run_migrations()


# ---------------------------------------------------------

if context.is_offline_mode():

    run_migrations_offline()

else:

    run_migrations_online()