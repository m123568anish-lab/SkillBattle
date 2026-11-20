from types import SimpleNamespace
import pytest
from httpx import AsyncClient
from app.core.dependencies import get_current_user
from app.main import app


@pytest.mark.asyncio
async def test_seo_endpoints_require_admin(client: AsyncClient):
    # Unauthenticated requests must be rejected
    res = await client.get("/admin/seo/overview")
    assert res.status_code in [401, 403]

    res_audit = await client.get("/admin/seo/audit")
    assert res_audit.status_code in [401, 403]


@pytest.mark.asyncio
async def test_seo_overview_and_audit(client: AsyncClient):
    previous_overrides = app.dependency_overrides.copy()
    user = SimpleNamespace(id="seo-admin-user", role="admin", is_superuser=True)

    async def override_current_user():
        return user

    app.dependency_overrides[get_current_user] = override_current_user
    try:
        # Authenticated admin gets overview
        res = await client.get("/admin/seo/overview")
        assert res.status_code == 200
        data = res.json()
        assert "overall_launch_score" in data
        assert "seo_health_score" in data
        assert data["sitemap_valid"] is True
        assert data["llms_txt_ready"] is True

        # Audit endpoint runs successfully
        res_audit = await client.get("/admin/seo/audit")
        assert res_audit.status_code == 200
        audit_data = res_audit.json()
        assert audit_data["total_pages_scanned"] >= 5
        assert len(audit_data["pages"]) >= 5
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous_overrides)


@pytest.mark.asyncio
async def test_sitemap_and_llms_meta(client: AsyncClient):
    previous_overrides = app.dependency_overrides.copy()
    user = SimpleNamespace(id="seo-admin-user", role="admin", is_superuser=True)

    async def override_current_user():
        return user

    app.dependency_overrides[get_current_user] = override_current_user
    try:
        # Sitemap stats endpoint
        res_sitemap = await client.get("/admin/seo/sitemap")
        assert res_sitemap.status_code == 200
        sitemap_data = res_sitemap.json()
        assert "qubira.in/sitemap.xml" in sitemap_data["sitemap_url"]
        assert sitemap_data["total_included_urls"] >= 5

        # LLMS.txt preview endpoint
        res_llms = await client.get("/admin/seo/llms")
        assert res_llms.status_code == 200
        llms_data = res_llms.json()
        assert "qubira.in" in llms_data["content"]
        assert llms_data["status"] == "active"
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous_overrides)


@pytest.mark.asyncio
async def test_launch_checklist_and_security(client: AsyncClient):
    previous_overrides = app.dependency_overrides.copy()
    user = SimpleNamespace(id="seo-admin-user", role="admin", is_superuser=True)

    async def override_current_user():
        return user

    app.dependency_overrides[get_current_user] = override_current_user
    try:
        # Launch checklist endpoint
        res_check = await client.get("/admin/seo/launch-checklist")
        assert res_check.status_code == 200
        checklist_data = res_check.json()
        assert checklist_data["overall_readiness_score"] >= 80
        assert len(checklist_data["checks"]) >= 6

        # Security scan summary
        res_sec = await client.get("/admin/seo/security")
        assert res_sec.status_code == 200
        sec_data = res_sec.json()
        assert sec_data["status"] == "clean"
        assert sec_data["secrets_found_count"] == 0
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous_overrides)
