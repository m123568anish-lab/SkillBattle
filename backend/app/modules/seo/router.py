"""
=========================================================

SkillBattle / Qubira
SEO & Production Launch Center Router

=========================================================
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel

from app.models.user import User
from app.core.dependencies import get_current_admin
from app.modules.seo.service import seo_service
from app.modules.seo.schemas import (
    SeoOverviewResponse,
    SeoAuditSummary,
    SearchConsoleData,
    BingWebmasterData,
    SitemapStats,
    LlmsTxtPreview,
    SocialMetaPreview,
    LaunchChecklistSummary,
    SecurityAuditSummary,
    PerformanceLabSummary,
    ProviderStatus,
)

router = APIRouter(
    prefix="/admin/seo",
    tags=["Admin SEO & Launch Center"],
)


@router.get("/overview", response_model=SeoOverviewResponse)
async def get_seo_overview(
    admin: User = Depends(get_current_admin),
):
    return seo_service.get_overview()


@router.get("/audit", response_model=SeoAuditSummary)
async def run_seo_audit(
    admin: User = Depends(get_current_admin),
):
    return seo_service.run_audit()


@router.get("/google", response_model=SearchConsoleData)
async def get_google_search_console(
    admin: User = Depends(get_current_admin),
):
    return seo_service.get_google_search_console()


@router.post("/google/connect", response_model=ProviderStatus)
async def connect_google_search_console(
    admin: User = Depends(get_current_admin),
):
    return seo_service.connect_google()


@router.post("/google/disconnect", response_model=ProviderStatus)
async def disconnect_google_search_console(
    admin: User = Depends(get_current_admin),
):
    return seo_service.disconnect_google()


@router.get("/bing", response_model=BingWebmasterData)
async def get_bing_webmaster(
    admin: User = Depends(get_current_admin),
):
    return seo_service.get_bing_webmaster()


@router.post("/bing/connect", response_model=ProviderStatus)
async def connect_bing_webmaster(
    admin: User = Depends(get_current_admin),
):
    return seo_service.connect_bing()


class IndexNowSubmitRequest(BaseModel):
    urls: List[str]


@router.post("/bing/indexnow", response_model=Dict[str, Any])
async def submit_indexnow(
    payload: IndexNowSubmitRequest,
    admin: User = Depends(get_current_admin),
):
    return seo_service.submit_indexnow(payload.urls)


@router.get("/sitemap", response_model=SitemapStats)
async def get_sitemap_stats(
    admin: User = Depends(get_current_admin),
):
    return seo_service.get_sitemap_stats()


@router.get("/llms", response_model=LlmsTxtPreview)
async def get_llms_txt(
    admin: User = Depends(get_current_admin),
):
    return seo_service.get_llms_txt()


@router.get("/open-graph", response_model=SocialMetaPreview)
async def get_open_graph_preview(
    admin: User = Depends(get_current_admin),
):
    return seo_service.get_open_graph_preview()


@router.get("/launch-checklist", response_model=LaunchChecklistSummary)
async def get_launch_checklist(
    admin: User = Depends(get_current_admin),
):
    return seo_service.get_launch_checklist()


@router.get("/security", response_model=SecurityAuditSummary)
async def get_security_audit(
    admin: User = Depends(get_current_admin),
):
    return seo_service.get_security_audit()


@router.get("/performance", response_model=PerformanceLabSummary)
async def get_performance_lab(
    admin: User = Depends(get_current_admin),
):
    return seo_service.get_performance_lab()
