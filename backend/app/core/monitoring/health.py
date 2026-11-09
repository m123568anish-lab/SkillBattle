"""
=========================================================
SkillBattle Health & Database Diagnostic Endpoints
=========================================================
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

from app.core.config import settings
from app.database.migration_preflight import (
    build_epoch_preflight_report,
    build_preflight_report,
)

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


async def _database_readiness_response() -> JSONResponse:
    try:
        report_builder = (
            build_epoch_preflight_report
            if settings.DATABASE_READINESS_MODE == "epoch"
            else build_preflight_report
        )
        report = await run_in_threadpool(report_builder)
    except Exception as exc:
        logger.error("Database readiness check failed (%s)", type(exc).__name__)
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "degraded",
                "database": "unreachable",
                "migration_status": "unknown",
                "connection_ready": False,
            },
        )

    connection_ready = report["eligible_for_migration"] is True
    current_revision = report["current_revision"]
    repository_head = report["repository_head"]
    migration_status = (
        "current"
        if connection_ready
        else "incompatible"
        if report.get("state_errors")
        or report.get("missing_applied_tables")
        or report.get("pending_table_conflicts")
        or current_revision in (None, "<invalid>")
        or repository_head is None
        else "pending"
        if current_revision != repository_head
        else "incompatible"
    )
    return JSONResponse(
        status_code=(
            status.HTTP_200_OK
            if connection_ready
            else status.HTTP_503_SERVICE_UNAVAILABLE
        ),
        content={
            "status": "ok" if connection_ready else "degraded",
            "database": "connected",
            "migration_status": migration_status,
            "connection_ready": connection_ready,
            "current_revision": current_revision,
            "repository_head": repository_head,
            "schema_difference_count": report["schema_difference_count"],
            "state_error_count": len(report["state_errors"]),
        },
    )


@router.get("/health/db")
async def db_health() -> JSONResponse:
    """Report read-only database and schema readiness."""
    return await _database_readiness_response()


@router.get("/ready")
async def readiness() -> JSONResponse:
    """Report whether the database schema is current and compatible."""
    return await _database_readiness_response()


@router.get("/live")
async def liveness():
    return {"alive": True}