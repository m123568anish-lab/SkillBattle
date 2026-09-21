"""
=========================================================
SkillBattle Health & Database Diagnostic Endpoints
=========================================================
"""

from __future__ import annotations

import logging
import platform
from typing import Dict, Any
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health")
async def health():
    """Lightweight application health check for Render & UptimeRobot."""
    return {
        "status": "ok",
        "app": "SkillBattle API",
        "version": "2.0.0",
    }


@router.get("/health/db")
async def db_health(db: AsyncSession = Depends(get_db)):
    """Safely verify database connectivity without exposing credentials."""
    try:
        result = await db.execute(text("SELECT 1"))
        val = result.scalar()
        if val == 1:
            return {
                "status": "ok",
                "database": "connected",
            }
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "degraded", "database": "unexpected response"}
        )
    except Exception as e:
        logger.error(f"❌ DB Health Check Failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "degraded", "database": "unreachable"}
        )


@router.get("/ready")
async def readiness():
    return {"ready": True}


@router.get("/live")
async def liveness():
    return {"alive": True}