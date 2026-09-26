"""
=========================================================

SkillBattle

Database Session

Production SQLAlchemy 2.x Async Session & Context Manager

=========================================================
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator, AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import normalize_async_database_url, settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------
# Database URL
# ---------------------------------------------------------

_raw_url = normalize_async_database_url(str(settings.ASYNC_DATABASE_URL))

# Guarantee the asyncpg driver is specified for PostgreSQL URLs.
# Without this, SQLAlchemy defaults to psycopg2 which is not installed.
if _raw_url.startswith("postgresql://"):
    DATABASE_URL = _raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif _raw_url.startswith("postgresql+psycopg://"):
    DATABASE_URL = _raw_url.replace("postgresql+psycopg://", "postgresql+asyncpg://", 1)
elif _raw_url.startswith("postgresql+psycopg2://"):
    DATABASE_URL = _raw_url.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)
else:
    DATABASE_URL = _raw_url

# ---------------------------------------------------------
# Engine Configuration
# ---------------------------------------------------------

engine_kwargs = {
    "echo": settings.DEBUG,
    "future": True,
    "pool_pre_ping": True,
}

# Optimize for PostgreSQL in production environment
if "postgresql" in DATABASE_URL:
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_timeout": 10,
        "pool_recycle": 300,
        "pool_pre_ping": True,
        "connect_args": {
            "timeout": 10,
            "command_timeout": 10,
        }
    })
    logger.info("🐘 Enterprise Async engine configured for PostgreSQL (pool_size=10, timeout=10s)")
else:
    logger.info("📁 Async engine configured for SQLite")

from pathlib import Path

# If using a relative SQLite async URL, ensure it points to an absolute path
if DATABASE_URL.startswith("sqlite"):
    try:
        url_path = DATABASE_URL.split("sqlite+aiosqlite:///", 1)[1]
    except Exception:
        url_path = None

    if url_path and (url_path.startswith("./") or not Path(url_path).is_absolute()):
        backend_dir = Path(__file__).resolve().parents[3]
        db_path = (backend_dir / url_path.lstrip("./"))
        db_path.parent.mkdir(parents=True, exist_ok=True)
        DATABASE_URL = f"sqlite+aiosqlite:///{db_path.as_posix()}"

engine = create_async_engine(DATABASE_URL, **engine_kwargs)

# ---------------------------------------------------------
# Session Factory
# ---------------------------------------------------------

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

# ---------------------------------------------------------
# Async Context Manager for Service & Repository Layers
# ---------------------------------------------------------

@asynccontextmanager
async def async_session_ctx() -> AsyncIterator[AsyncSession]:
    """
    Transactional Async Session Context Manager.
    Guarantees clean release and commit/rollback handling for all DB operations.
    Usage:
        async with async_session_ctx() as session:
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# ---------------------------------------------------------
# FastAPI Dependency
# ---------------------------------------------------------

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield_succeeded = False
        try:
            yield session
            yield_succeeded = True
            if session.is_active and (session.dirty or session.new or session.deleted):
                await session.commit()
        except Exception:
            try:
                await session.rollback()
            except Exception:
                pass
            if not yield_succeeded:
                logger.exception("Database transaction rolled back due to error in request handler")
                raise
            else:
                logger.warning("Database commit failed after successful response handler; rolled back cleanly")
        finally:
            await session.close()