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
from app.core.config import settings
from app.database.migration_infrastructure.sqlite_lock import (
    canonical_database_path,
)
from app.database.migration_infrastructure.migration_coordinator import (
    PostgreSQLMigrationOwnership,
    postgresql_database_identity,
)
from sqlalchemy.pool import NullPool
from sqlalchemy.engine import make_url

# ---------------------------------------------------------
# ---------------------------------------------------------

config = context.config

# ---------------------------------------------------------
# Use the application's resolved sync URL so Alembic and FastAPI target the same
# absolute SQLite file or PostgreSQL database.
# ---------------------------------------------------------

database_url = (
    settings.MIGRATION_DATABASE_URL.strip()
    or str(settings.DATABASE_URL)
)
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+psycopg://", 1)
elif database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)
elif database_url.startswith("postgresql+psycopg2://"):
    database_url = database_url.replace(
        "postgresql+psycopg2://",
        "postgresql+psycopg://",
        1,
    )
database_url_object = make_url(database_url)
if (
    database_url_object.get_backend_name() == "postgresql"
    and "-pooler" in (database_url_object.host or "")
):
    raise RuntimeError(
        "Alembic requires a direct PostgreSQL connection. "
        "Set MIGRATION_DATABASE_URL to Neon's unpooled connection string."
    )
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
    raise RuntimeError(
        "Offline Alembic execution is blocked; use the explicitly invoked "
        "coordinated migration runner."
    )


# ---------------------------------------------------------


def run_migrations_online() -> None:
    """Run migrations in online mode."""

    connection = config.attributes.get("connection")
    ownership = config.attributes.get("migration_ownership")

    if application_engine.dialect.name == "sqlite":
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

    if application_engine.dialect.name == "postgresql":
        if not isinstance(ownership, PostgreSQLMigrationOwnership):
            raise RuntimeError(
                "PostgreSQL Alembic execution requires a PostgreSQL migration "
                "ownership lease."
            )
        if (
            connection is None
            or connection is not ownership.connection
            or not ownership.is_active
            or not isinstance(connection.engine.pool, NullPool)
            or postgresql_database_identity(connection.engine.url)
            != ownership.database_identity
            or postgresql_database_identity(database_url_object)
            != ownership.database_identity
        ):
            raise RuntimeError(
                "PostgreSQL Alembic execution is not using the active dedicated "
                "migration connection for the configured database."
            )
        ownership.assert_connection(connection)
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
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