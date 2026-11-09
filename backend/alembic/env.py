from __future__ import annotations

import logging
from logging.config import fileConfig

from alembic import context

# ---------------------------------------------------------
# Import SQLAlchemy Base
# ---------------------------------------------------------

from app.models import Base
from app.modules.audit.model import AuditLog
from app.database.database import engine as application_engine
from app.database.migration_infrastructure.sqlite_lock import (
    canonical_database_path,
)

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

    if application_engine.dialect.name == "sqlite":
        connection = config.attributes.get("connection")
        ownership = config.attributes.get("migration_ownership")
        if (
            connection is None
            or ownership is None
            or connection is not getattr(ownership, "connection", None)
            or not getattr(ownership, "is_active", False)
            or canonical_database_path(application_engine.url.database or "")
            != getattr(ownership, "database_path", None)
        ):
            raise RuntimeError(
                "SQLite Alembic execution requires an active maintenance-window "
                "migration ownership lease."
            )

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            render_as_batch=True,
        )
        with context.begin_transaction():
            context.run_migrations()
        return

    raise RuntimeError(
        f"Legacy Alembic execution is blocked for "
        f"{application_engine.dialect.name!r} until a shared migration "
        "ownership mechanism is implemented and validated."
    )


# ---------------------------------------------------------

if context.is_offline_mode():

    run_migrations_offline()

else:

    run_migrations_online()