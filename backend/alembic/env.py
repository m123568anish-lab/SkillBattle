from __future__ import annotations

from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# ---------------------------------------------------------
# Import your project settings
# ---------------------------------------------------------

from app.core.config import settings

# ---------------------------------------------------------
# Import SQLAlchemy Base
# ---------------------------------------------------------

from app.database.base import Base

# ---------------------------------------------------------
# Import ALL models here
#
# IMPORTANT:
# Alembic only detects tables that are imported.
# ---------------------------------------------------------

# Models live under `app.models` — import them so Alembic
# can detect table metadata.
from app.models.user import User
from app.models.resume import Resume
from app.models.refresh_token import RefreshToken

# ---------------------------------------------------------

config = context.config

# ---------------------------------------------------------
# Read database url from .env
# ---------------------------------------------------------

database_url = settings.DATABASE_URL

# Alembic uses synchronous engines.
# Remove async driver.

database_url = database_url.replace(
    "+aiosqlite",
    "",
)

database_url = database_url.replace(
    "+asyncpg",
    "",
)

# The backend installs Psycopg 3, not the legacy psycopg2 driver.
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

config.set_main_option(
    "sqlalchemy.url",
    database_url,
)

# ---------------------------------------------------------

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

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
        )

        with context.begin_transaction():
            context.run_migrations()


# ---------------------------------------------------------

if context.is_offline_mode():

    run_migrations_offline()

else:

    run_migrations_online()