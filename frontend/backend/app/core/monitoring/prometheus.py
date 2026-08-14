"""
=========================================================

Prometheus Endpoint

=========================================================
"""

from prometheus_client import generate_latest
from fastapi import APIRouter
from fastapi.responses import Response

router = APIRouter()


@router.get("/metrics")

async def prometheus_metrics():

    return Response(

        generate_latest(),

        media_type="text/plain",

    )