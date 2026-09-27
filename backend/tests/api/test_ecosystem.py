from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.database.session import AsyncSessionLocal
from app.models.question import Question
from app.models.user import User


async def _register_and_login(client: AsyncClient, username: str, email: str, name: str, password: str) -> dict[str, str]:
    registered = await client.post(
        "/auth/register",
        json={"username": username, "email": email, "full_name": name, "password": password},
    )
    assert registered.status_code == 201, registered.text
    login = await client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200, login.text
    return {"Authorization": f"Bearer {login.json()['tokens']['access_token']}"}


@pytest.mark.asyncio
async def test_college_to_company_verified_skill_and_shortlist_flow(client: AsyncClient):
    suffix = uuid4().hex[:8].lower()
    college_email = f"tpo_{suffix}@example.com"
    college_register = await client.post(
        "/api/v1/college/register",
        json={
            "name": f"Ecosystem College {suffix}",
            "code": f"EC{suffix.upper()}",
            "domain": "example.com",
            "admin_name": "Placement Officer",
            "admin_email": college_email,
            "admin_password": "CollegePass#123",
        },
    )
    assert college_register.status_code == 200, college_register.text
    college_admin_login = await client.post(
        "/auth/login",
        json={"email": college_email, "password": "CollegePass#123"},
    )
    assert college_admin_login.status_code == 200, college_admin_login.text
    college_admin_headers = {
        "Authorization": f"Bearer {college_admin_login.json()['tokens']['access_token']}"
    }
    department = await client.post(
        "/api/v1/college/department",
        headers=college_admin_headers,
        json={"name": "Computer Science", "code": f"CS{suffix[:4]}"},
    )
    assert department.status_code == 200, department.text
    batch = await client.post(
        "/api/v1/college/batch",
        headers=college_admin_headers,
        json={"name": f"Class {suffix}", "passout_year": 2027, "department_id": department.json()["id"]},
    )
    assert batch.status_code == 200, batch.text

    college_assessment = await client.post(
        "/api/v1/college/assessment",
        headers=college_admin_headers,
        json={
            "department_id": department.json()["id"],
            "batch_id": batch.json()["id"],
            "title": "Verified Algorithms Test",
            "assessment_type": "MCQ",
            "pass_marks": 5,
            "total_marks": 10,
            "questions": [
                {
                    "question_type": "MCQ",
                    "skill_category": "Algorithms",
                    "question_text": "What is the time complexity of binary search?",
                    "options": ["O(log n)", "O(n)"],
                    "correct_option": "O(log n)",
                    "marks": 10,
                }
            ],
        },
    )
    assert college_assessment.status_code == 200, college_assessment.text

    student_email = f"candidate_{suffix}@example.com"
    student_headers = await _register_and_login(
        client, f"candidate_{suffix}", student_email, "Ecosystem Candidate", "CandidatePass#123"
    )
    enrolled = await client.post(
        "/api/v1/college/student/add",
        headers=college_admin_headers,
        json={
            "user_email_or_username": student_email,
            "department_id": department.json()["id"],
            "batch_id": batch.json()["id"],
            "roll_number": f"R-{suffix}",
        },
    )
    assert enrolled.status_code == 200, enrolled.text

    assigned = await client.get("/api/v1/college/student/my-assessments", headers=student_headers)
    assert assigned.status_code == 200, assigned.text
    assigned_assessment = next(
        item for item in assigned.json() if item["id"] == college_assessment.json()["id"]
    )
    college_question = assigned_assessment["questions"][0]
    assert "correct_option" not in college_question
    submitted = await client.post(
        "/api/v1/college/student/assessment/submit",
        headers=student_headers,
        json={
            "assessment_id": college_assessment.json()["id"],
            "answers": {f"q_{college_question['id']}": "O(log n)"},
        },
    )
    assert submitted.status_code == 200, submitted.text
    assert submitted.json()["percentage"] == 100

    verified_profile = await client.get("/api/v1/profile/skill-profile", headers=student_headers)
    assert verified_profile.status_code == 200, verified_profile.text
    algorithm_skill = next(skill for skill in verified_profile.json()["skills"] if skill["skill"] == "Algorithms")
    assert algorithm_skill["score"] == 100
    assert algorithm_skill["sources"] == ["college_assessment"]

    privacy = await client.put(
        "/api/v1/profile/sharing-settings",
        headers=student_headers,
        json={
            "share_contact_info": True,
            "share_skill_profile": True,
            "share_assessment_results": True,
            "allow_recruiter_search": True,
        },
    )
    assert privacy.status_code == 200, privacy.text

    company_email = f"recruiter_{suffix}@example.com"
    company_headers = await _register_and_login(
        client, f"recruiter_{suffix}", company_email, "Recruiter", "RecruiterPass#123"
    )
    company_register = await client.post(
        "/api/v1/company/register",
        headers=company_headers,
        json={"name": f"Ecosystem Company {suffix}", "slug": f"ecosystem-{suffix}"},
    )
    assert company_register.status_code == 200, company_register.text
    assert company_register.json()["status"] == "pending"

    admin_email = f"platform_{suffix}@example.com"
    admin_headers = await _register_and_login(
        client, f"platform_{suffix}", admin_email, "Platform Admin", "PlatformPass#123"
    )
    async with AsyncSessionLocal() as db:
        admin_result = await db.execute(select(User).where(User.email == admin_email))
        platform_admin = admin_result.scalar_one()
        platform_admin.role = "admin"
        platform_admin.is_superuser = True
        await db.commit()
    approved = await client.patch(
        f"/api/v1/company/admin/companies/{company_register.json()['id']}/status",
        headers=admin_headers,
        json={"status": "verified"},
    )
    assert approved.status_code == 200, approved.text

    job = await client.post(
        "/api/v1/company/jobs",
        headers=company_headers,
        json={
            "title": "Algorithms Engineer",
            "required_skills": "Algorithms",
            "status": "open",
        },
    )
    assert job.status_code == 200, job.text

    question_slug = f"ecosystem-algorithms-{suffix}"
    async with AsyncSessionLocal() as db:
        db.add(
            Question(
                title=f"Ecosystem Algorithms {suffix}",
                slug=question_slug,
                description="Choose the algorithm complexity.",
                difficulty="Easy",
                question_type="mcq",
                options=[{"key": "A", "text": "O(n log n)"}, {"key": "B", "text": "O(n^2)"}],
                correct_option="A",
                skill_category="Algorithms",
                topic_tags=["Algorithms"],
            )
        )
        await db.commit()

    assessment_config = await client.post(
        f"/api/v1/company/jobs/{job.json()['id']}/assessment",
        headers=company_headers,
        json={
            "title": "Algorithms Hiring Assessment",
            "difficulty": "easy",
            "duration_minutes": 10,
            "question_count": 1,
            "sections": [
                {
                    "title": "Algorithms",
                    "question_type": "mcq",
                    "skill_category": "Algorithms",
                    "question_count": 1,
                    "weight": 1,
                    "duration_minutes": 10,
                }
            ],
        },
    )
    assert assessment_config.status_code == 200, assessment_config.text

    openings = await client.get("/api/v1/company/openings", headers=student_headers)
    assert openings.status_code == 200, openings.text
    assert any(item["job_id"] == job.json()["id"] for item in openings.json())
    application = await client.post(
        "/api/v1/company/applications",
        headers=student_headers,
        json={"job_id": job.json()["id"], "consent_to_recruiters": True},
    )
    assert application.status_code == 200, application.text
    application_id = application.json()["application_id"]

    my_applications = await client.get("/api/v1/company/my-applications", headers=student_headers)
    assert my_applications.status_code == 200, my_applications.text
    assert any(item["assessment_config_id"] == assessment_config.json()["id"] for item in my_applications.json())

    battle = await client.post(
        "/api/v1/battle/create",
        headers=student_headers,
        json={
            "title": "Algorithms hiring assessment",
            "difficulty": "easy",
            "config_id": assessment_config.json()["id"],
            "battle_type": "company",
            "max_players": 1,
        },
    )
    assert battle.status_code == 200, battle.text
    question = battle.json()["questions_data"][0]["questions"][0]
    assert "correct_option" not in question
    submitted_company = await client.post(
        "/api/v1/battle/submit-answer",
        headers=student_headers,
        json={
            "battle_id": battle.json()["id"],
            "question_id": question["id"],
            "section_index": 0,
            "question_type": "mcq",
            "mcq_option": "A",
        },
    )
    assert submitted_company.status_code == 200, submitted_company.text
    completed = await client.post(
        f"/api/v1/battle/{battle.json()['id']}/finish",
        headers=student_headers,
    )
    assert completed.status_code == 200, completed.text

    company_candidates = await client.get(
        f"/api/v1/company/candidates?job_id={job.json()['id']}",
        headers=company_headers,
    )
    assert company_candidates.status_code == 200, company_candidates.text
    candidate = next(row for row in company_candidates.json() if row["application_id"] == application_id)
    assert candidate["eligible"] is True
    assert candidate["assessment_status"] == "completed"
    assert candidate["assessment_score"] == 100
    assert candidate["skill_profile"]["skills"]

    shortlisted = await client.patch(
        f"/api/v1/company/applications/{application_id}/status",
        headers=company_headers,
        json={"status": "shortlisted"},
    )
    assert shortlisted.status_code == 200, shortlisted.text
    assert shortlisted.json()["status"] == "shortlisted"
