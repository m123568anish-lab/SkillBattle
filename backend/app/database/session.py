"""
=========================================================

SkillBattle

Database Session

Production SQLAlchemy 2.x Async Session

=========================================================
"""

from __future__ import annotations

import logging
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------
# Database URL
# ---------------------------------------------------------

DATABASE_URL = str(settings.ASYNC_DATABASE_URL)

# ---------------------------------------------------------
# Engine Configuration
# ---------------------------------------------------------

engine_kwargs = {
    "echo": settings.DEBUG,
    "future": True,
    "pool_pre_ping": True,
}

# Optimize for different database types
if "postgresql" in DATABASE_URL:
    engine_kwargs["pool_size"] = 20
    engine_kwargs["max_overflow"] = 10
    logger.info("🐘 Async engine configured for PostgreSQL")
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
# Dependency
# ---------------------------------------------------------

async def get_db() -> AsyncGenerator[AsyncSession, None]:

    async with AsyncSessionLocal() as session:

        try:

            yield session

        finally:

            await session.close()