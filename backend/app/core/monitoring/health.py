"""
=========================================================
SkillBattle Health & Database Diagnostic Endpoints
=========================================================
"""

from __future__ import annotations

import logging
from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db

logger = logging.getLogger(__name__)

router = APIRouter()


@router.api_route("/health", methods=["GET", "HEAD"])
async def health():
    """Lightweight application health check for Render & UptimeRobot."""
    return {
        "status": "healthy",
        "app": "SkillBattle API",
        "version": "2.0.0",
    }


@router.get("/health/db")
async def db_health(db: AsyncSession = Depends(get_db)):
    """Verify connectivity and migration readiness without exposing configuration."""
    database_type = db.get_bind().dialect.name
    try:
        result = await db.execute(text("SELECT 1"))
        val = result.scalar()
        if val != 1:
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={
                    "status": "degraded",
                    "database": "connected",
                    "database_type": database_type,
                    "migration_status": "unknown",
                    "connection_ready": False,
                },
            )
    except Exception as exc:
        logger.error("Database health query failed (%s)", type(exc).__name__)
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "degraded",
                "database": "unreachable",
                "database_type": database_type,
                "migration_status": "unknown",
                "connection_ready": False,
            },
        )

    try:
        revisions = (
            await db.execute(text("SELECT version_num FROM alembic_version"))
        ).scalars().all()
        alembic_ini = Path(__file__).resolve().parents[3] / "alembic.ini"
        script_config = Config(str(alembic_ini))
        script = ScriptDirectory.from_config(script_config)
        expected_revisions = sorted(script.get_heads())
        migration_status = (
            "current" if sorted(revisions) == expected_revisions else "pending"
        )
    except Exception as exc:
        logger.error("Database migration status check failed (%s)", type(exc).__name__)
        migration_status = "unavailable"

    connection_ready = migration_status == "current"
    return JSONResponse(
        status_code=(
            status.HTTP_200_OK
            if connection_ready
            else status.HTTP_503_SERVICE_UNAVAILABLE
        ),
        content={
            "status": "ok" if connection_ready else "degraded",
            "database": "connected",
            "database_type": database_type,
            "migration_status": migration_status,
            "connection_ready": connection_ready,
        },
    )


@router.get("/ready")
async def readiness():
    return {"ready": True}


@router.get("/live")
async def liveness():
    return {"alive": True}