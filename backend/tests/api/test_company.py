import pytest
from sqlalchemy import select
from uuid import uuid4
from httpx import AsyncClient

from app.database.session import AsyncSessionLocal
from app.models.user import User


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
    assert company_data["status"] == "pending"

    dashboard_resp = await client.get("/company/dashboard", headers=headers)
    assert dashboard_resp.status_code == 200, dashboard_resp.text
    dashboard_data = dashboard_resp.json()
    assert dashboard_data["company"]["name"] == "SkillBattle Labs"

    blocked_job_resp = await client.post(
        "/company/jobs",
        headers=headers,
        json={"title": "Unapproved role", "status": "open"},
    )
    assert blocked_job_resp.status_code == 403, blocked_job_resp.text

    admin_email = f"platform_admin_{unique_id}@example.com"
    admin_register = await client.post(
        "/auth/register",
        json={
            "username": f"platform_admin_{unique_id}",
            "email": admin_email,
            "full_name": "Platform Administrator",
            "password": "PlatformPass#123",
        },
    )
    assert admin_register.status_code == 201, admin_register.text
    async with AsyncSessionLocal() as db:
        admin_result = await db.execute(select(User).where(User.email == admin_email))
        admin_user = admin_result.scalar_one()
        admin_user.role = "admin"
        admin_user.is_superuser = True
        await db.commit()

    admin_login = await client.post(
        "/auth/login",
        json={"email": admin_email, "password": "PlatformPass#123"},
    )
    assert admin_login.status_code == 200, admin_login.text
    admin_headers = {
        "Authorization": f"Bearer {admin_login.json()['tokens']['access_token']}"
    }
    pending_companies = await client.get("/company/admin/companies/pending", headers=admin_headers)
    assert pending_companies.status_code == 200, pending_companies.text
    assert any(item["id"] == company_data["id"] for item in pending_companies.json())
    verification = await client.patch(
        f"/company/admin/companies/{company_data['id']}/status",
        headers=admin_headers,
        json={"status": "verified"},
    )
    assert verification.status_code == 200, verification.text

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

    assessment_resp = await client.post(
        f"/company/jobs/{job_resp.json()['id']}/assessment",
        headers=headers,
        json={
            "title": "Full Stack Hiring Assessment",
            "description": "Algorithms and backend fundamentals",
            "difficulty": "medium",
            "duration_minutes": 30,
            "question_count": 1,
            "sections": [
                {
                    "title": "Algorithms",
                    "question_type": "mcq",
                    "question_count": 1,
                    "weight": 1,
                    "duration_minutes": 30,
                    "negative_marking": False,
                }
            ],
        },
    )
    assert assessment_resp.status_code == 200, assessment_resp.text
    assessment = assessment_resp.json()
    assert assessment["battle_type"] == "company"
    assert assessment["company_id"] == company_data["id"]
    assert assessment["job_id"] == job_resp.json()["id"]
    assert assessment["visibility"] == "private"

    public_configs = await client.get("/battle/configs?battle_type=company")
    assert public_configs.status_code == 200, public_configs.text
    assert all(config["id"] != assessment["id"] for config in public_configs.json())

    openings_resp = await client.get("/company/openings")
    assert openings_resp.status_code == 200, openings_resp.text
    assert any(
        opening["job_id"] == job_resp.json()["id"] and opening["assessment_available"]
        for opening in openings_resp.json()
    )

    jobs_resp = await client.get("/company/jobs", headers=headers)
    assert jobs_resp.status_code == 200, jobs_resp.text
    assert any(item["title"] == "Senior Full Stack Engineer" for item in jobs_resp.json())

    versioned_health = await client.get("/api/v1/company/health")
    assert versioned_health.status_code == 200, versioned_health.text

    application_resp = await client.post(
        "/api/v1/company/applications",
        headers=headers,
        json={"job_id": job_resp.json()["id"], "candidate_user_id": "another-user-id"},
    )
    assert application_resp.status_code == 403, application_resp.text

    candidate_rows = []
    for consent in (False, True):
        candidate_id = uuid4().hex[:8].lower()
        candidate_email = f"candidate_{candidate_id}@example.com"
        candidate_password = "CandidatePass#123"
        candidate_register = await client.post(
            "/auth/register",
            json={
                "username": f"candidate_{candidate_id}",
                "email": candidate_email,
                "full_name": f"Candidate {candidate_id}",
                "password": candidate_password,
            },
        )
        assert candidate_register.status_code == 201, candidate_register.text
        candidate_login = await client.post(
            "/auth/login",
            json={"email": candidate_email, "password": candidate_password},
        )
        assert candidate_login.status_code == 200, candidate_login.text
        candidate_headers = {
            "Authorization": f"Bearer {candidate_login.json()['tokens']['access_token']}"
        }
        privacy_resp = await client.put(
            "/profile/sharing-settings",
            headers=candidate_headers,
            json={
                "share_contact_info": consent,
                "share_skill_profile": consent,
                "share_assessment_results": consent,
                "allow_recruiter_search": consent,
            },
        )
        assert privacy_resp.status_code == 200, privacy_resp.text
        candidate_application = await client.post(
            "/api/v1/company/applications",
            headers=candidate_headers,
            json={"job_id": job_resp.json()["id"], "consent_to_recruiters": consent},
        )
        assert candidate_application.status_code == 200, candidate_application.text

    candidates_resp = await client.get("/api/v1/company/candidates", headers=headers)
    assert candidates_resp.status_code == 200, candidates_resp.text
    candidate_rows = candidates_resp.json()
    opted_out = next(row for row in candidate_rows if not row["consent"])
    opted_in = next(row for row in candidate_rows if row["consent"])
    assert opted_out["candidate_id"] is None
    assert opted_out["candidate_email"] == ""
    assert opted_out["candidate_name"] == "Private candidate"
    assert opted_in["candidate_id"] is not None
    assert opted_in["candidate_email"].startswith("candidate_")


@pytest.mark.asyncio
async def test_company_access_requires_auth(client: AsyncClient):
    response = await client.get("/company/dashboard")
    assert response.status_code in (401, 403)
