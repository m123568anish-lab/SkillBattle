from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.database.session import AsyncSessionLocal
from app.models.company import ApplicationStatusHistory, CandidateApplication, Company, JobPosting, SavedOpportunity
from app.models.user import User


async def register_and_login(client: AsyncClient, prefix: str) -> tuple[dict, dict]:
    suffix = uuid4().hex[:8]
    email = f"{prefix}_{suffix}@example.com"
    response = await client.post("/auth/register", json={"username": f"{prefix}_{suffix}", "email": email, "full_name": prefix, "password": "StrongPass#123"})
    assert response.status_code == 201, response.text
    login = await client.post("/auth/login", json={"email": email, "password": "StrongPass#123"})
    assert login.status_code == 200, login.text
    return {"Authorization": f"Bearer {login.json()['tokens']['access_token']}"}, login.json()["user"]


async def verified_company_and_job(client: AsyncClient, **job_data) -> tuple[dict, int]:
    headers, _ = await register_and_login(client, "recruiter")
    suffix = uuid4().hex[:8]
    created = await client.post("/company/register", headers=headers, json={"name": f"Company {suffix}", "slug": f"company-{suffix}", "industry": "Software"})
    assert created.status_code == 200, created.text
    async with AsyncSessionLocal() as db:
        company = await db.get(Company, created.json()["id"])
        company.status = "verified"
        owner = await db.get(User, company.created_by_user_id)
        owner.role, owner.status, owner.is_verified = "company_admin", "ACTIVE", True
        await db.commit()
    payload = {"title": "Data Engineer", "location": "Bengaluru", "employment_type": "internship", "required_skills": "Python, SQL", "status": "open", "category": "Data Analytics and SQL", "work_mode": "hybrid", **job_data}
    job = await client.post("/company/jobs", headers=headers, json=payload)
    assert job.status_code == 200, job.text
    return headers, job.json()["id"]


@pytest.mark.asyncio
async def test_opportunity_filters_pagination_and_lifecycle(client: AsyncClient):
    _, active_id = await verified_company_and_job(client, title="Python Analyst")
    _, expired_id = await verified_company_and_job(client, title="Expired Analyst", deadline_at=(datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat())
    listing = await client.get("/company/openings", params={"q": "Python", "category": "Data Analytics and SQL", "work_mode": "hybrid", "page": 1, "page_size": 1})
    assert listing.status_code == 200, listing.text
    body = listing.json()
    assert body["page"] == 1 and body["page_size"] == 1
    assert [item["job_id"] for item in body["items"]] == [active_id]
    assert expired_id not in [item["job_id"] for item in body["items"]]
    expired = await client.get(f"/company/openings/{expired_id}")
    assert expired.status_code == 200
    assert expired.json()["is_open"] is False


@pytest.mark.asyncio
async def test_save_internal_and_external_application_persistence(client: AsyncClient):
    _, internal_job = await verified_company_and_job(client, title="Internal role")
    _, external_job = await verified_company_and_job(client, title="External role", application_url="https://careers.example.com/apply")
    student_headers, student = await register_and_login(client, "student")
    saved = await client.put(f"/company/openings/{internal_job}/save", headers=student_headers)
    assert saved.status_code == 200 and saved.json()["saved"] is True
    assert (await client.put(f"/company/openings/{internal_job}/save", headers=student_headers)).status_code == 200
    saved_rows = await client.get("/company/saved-opportunities", headers=student_headers)
    assert [row["job_id"] for row in saved_rows.json()] == [internal_job]
    applied = await client.post("/company/applications", headers=student_headers, json={"job_id": internal_job})
    assert applied.status_code == 200, applied.text
    assert (await client.post("/company/applications", headers=student_headers, json={"job_id": internal_job})).status_code == 409
    assert (await client.post("/company/applications", headers=student_headers, json={"job_id": external_job})).status_code == 409
    external = await client.post("/company/applications/external", headers=student_headers, json={"job_id": external_job, "confirm_applied": True})
    assert external.status_code == 200, external.text
    applications = await client.get("/company/my-applications", headers=student_headers)
    assert {row["application_method"] for row in applications.json()} == {"internal", "external_self_reported"}
    async with AsyncSessionLocal() as db:
        assert (await db.execute(select(SavedOpportunity).where(SavedOpportunity.user_id == student["id"]))).scalars().all()
        histories = (await db.execute(select(ApplicationStatusHistory))).scalars().all()
        assert len(histories) >= 2


@pytest.mark.asyncio
async def test_opportunity_ownership_and_expiration_are_enforced(client: AsyncClient):
    _, job_id = await verified_company_and_job(client, deadline_at=(datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat())
    one_headers, _ = await register_and_login(client, "studentone")
    two_headers, _ = await register_and_login(client, "studenttwo")
    assert (await client.post("/company/applications", headers=one_headers, json={"job_id": job_id})).status_code == 409
    assert (await client.get("/company/saved-opportunities")).status_code in {401, 403}
    assert (await client.put(f"/company/openings/{job_id}/save", headers=two_headers)).status_code == 200


@pytest.mark.asyncio
async def test_legacy_demo_company_openings_are_hidden_without_deleting_records(client: AsyncClient, monkeypatch):
    _, job_id = await verified_company_and_job(client, title="Demo Software Engineer")
    legacy_slug = f"legacy-demo-company-test-{uuid4().hex[:8]}"
    async with AsyncSessionLocal() as db:
        job = await db.get(JobPosting, job_id)
        company = await db.get(Company, job.company_id)
        company.slug = legacy_slug
        await db.commit()

    from app.modules.company import service as company_service_module

    monkeypatch.setattr(company_service_module, "LEGACY_DEMO_COMPANY_SLUG", legacy_slug)
    listing = await client.get("/company/openings")
    assert listing.status_code == 200
    assert job_id not in {item["job_id"] for item in listing.json()["items"]}
    assert (await client.get(f"/company/openings/{job_id}")).status_code == 404

    async with AsyncSessionLocal() as db:
        assert await db.get(JobPosting, job_id) is not None
