"""
=========================================================

Health Check

=========================================================
"""

from __future__ import annotations

import platform
import psutil

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")

async def health():

    return {

        "status": "healthy",

        "cpu_percent": psutil.cpu_percent(),

        "memory_percent": psutil.virtual_memory().percent,

        "python": platform.python_version(),

    }


@router.get("/ready")

async def readiness():

    return {

        "ready": True,

    }


@router.get("/live")

async def liveness():

    return {

        "alive": True,

    }