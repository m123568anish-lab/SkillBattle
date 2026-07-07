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