import pytest
from uuid import uuid4
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_company_registration_and_job_workflow(client: AsyncClient):
    unique_id = uuid4().hex[:6].lower()
    email = f"company_{unique_id}@example.com"
    username = f"company_admin_{unique_id}"
    slug = f"skillbattle-labs-{unique_id}"

    register_resp = await client.post(
        "/auth/register",
        json={
            "username": username,
            "email": email,
            "full_name": "Hiring Manager",
            "password": "StrongPass#123",
        },
    )
    assert register_resp.status_code == 201, register_resp.text

    login_resp = await client.post(
        "/auth/login",
        json={"email": email, "password": "StrongPass#123"},
    )
    assert login_resp.status_code == 200, login_resp.text
    token = login_resp.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    company_resp = await client.post(
        "/company/register",
        headers=headers,
        json={
            "name": "SkillBattle Labs",
            "slug": slug,
            "industry": "Software",
            "website": "https://skillbattle.ai",
            "headquarters": "Bengaluru",
            "description": "AI hiring platform",
        },
    )
    assert company_resp.status_code == 200, company_resp.text
    company_data = company_resp.json()
    assert company_data["name"] == "SkillBattle Labs"

    dashboard_resp = await client.get("/company/dashboard", headers=headers)
    assert dashboard_resp.status_code == 200, dashboard_resp.text
    dashboard_data = dashboard_resp.json()
    assert dashboard_data["company"]["name"] == "SkillBattle Labs"

    job_resp = await client.post(
        "/company/jobs",
        headers=headers,
        json={
            "title": "Senior Full Stack Engineer",
            "location": "Remote",
            "employment_type": "full_time",
            "remote_allowed": True,
            "description": "Build AI products for students and companies.",
            "required_skills": "Python, Next.js, SQL",
            "compensation": "₹25L - ₹35L",
            "status": "open",
        },
    )
    assert job_resp.status_code == 200, job_resp.text
    assert job_resp.json()["title"] == "Senior Full Stack Engineer"

    jobs_resp = await client.get("/company/jobs", headers=headers)
    assert jobs_resp.status_code == 200, jobs_resp.text
    assert any(item["title"] == "Senior Full Stack Engineer" for item in jobs_resp.json())


@pytest.mark.asyncio
async def test_company_access_requires_auth(client: AsyncClient):
    response = await client.get("/company/dashboard")
    assert response.status_code in (401, 403)
