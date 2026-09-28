"""
=========================================================
SkillBattle - College & Placement Cell Platform Tests
=========================================================
"""

import pytest
from uuid import uuid4
from httpx import AsyncClient
from sqlalchemy import select

from app.database.session import AsyncSessionLocal
from app.models.user import User


@pytest.mark.asyncio
async def test_college_registration_and_workflow(client: AsyncClient):
    """Test college registration, department creation, student link, assessment creation, and analytics."""
    unique_id = uuid4().hex[:6].upper()
    code = f"IITD_{unique_id}"
    admin_email = f"tpo_{unique_id.lower()}@iitd.ac.in"
    admin_username = f"admin_{code.lower()}"

    # 1. Register College
    payload = {
        "name": f"IIT Delhi ({code})",
        "code": code,
        "domain": "iitd.ac.in",
        "city": "New Delhi",
        "state": "Delhi",
        "admin_name": "Dr. Placement Officer",
        "admin_email": admin_email,
        "admin_password": "CollegeAdmin#123",
    }
    
    response = await client.post("/api/v1/college/register", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["code"] == code
    assert data["is_verified"] is False

    platform_admin_email = f"platform_admin_{unique_id.lower()}@example.com"
    admin_registration = await client.post(
        "/auth/register",
        json={
            "username": f"platform_admin_{unique_id.lower()}",
            "email": platform_admin_email,
            "full_name": "Platform Administrator",
            "password": "PlatformPass#123",
        },
    )
    assert admin_registration.status_code == 201, admin_registration.text
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == platform_admin_email))
        platform_admin = result.scalar_one()
        platform_admin.role = "admin"
        platform_admin.is_superuser = True
        await db.commit()

    admin_login = await client.post(
        "/auth/login",
        json={"email": platform_admin_email, "password": "PlatformPass#123"},
    )
    assert admin_login.status_code == 200, admin_login.text
    admin_headers = {
        "Authorization": f"Bearer {admin_login.json()['tokens']['access_token']}"
    }
    pending_colleges = await client.get(
        "/api/v1/college/admin/colleges/pending",
        headers=admin_headers,
    )
    assert pending_colleges.status_code == 200, pending_colleges.text
    assert any(item["id"] == data["id"] for item in pending_colleges.json())
    approval = await client.patch(
        f"/api/v1/college/admin/colleges/{data['id']}/status",
        headers=admin_headers,
        json={"status": "verified"},
    )
    assert approval.status_code == 200, approval.text
    assert approval.json()["is_verified"] is True

    # 2. Login as College Admin
    login_resp = await client.post("/auth/login", json={"email": admin_email, "password": "CollegeAdmin#123"})
    assert login_resp.status_code == 200
    assert login_resp.json()["user"]["role"] == "college_admin"
    assert login_resp.json()["user"]["status"] == "ACTIVE"
    token = login_resp.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Create Department
    dept_resp = await client.post(
        "/api/v1/college/department",
        headers=headers,
        json={"name": "Computer Science & Engineering", "code": "CSE", "head_name": "Prof. Sharma"},
    )
    assert dept_resp.status_code == 200
    dept_data = dept_resp.json()
    assert dept_data["code"] == "CSE"

    # 4. Create Batch
    batch_resp = await client.post(
        "/api/v1/college/batch",
        headers=headers,
        json={"name": "Batch 2023-2027", "passout_year": 2027, "department_id": dept_data["id"]},
    )
    assert batch_resp.status_code == 200
    batch_data = batch_resp.json()
    assert batch_data["name"] == "Batch 2023-2027"

    # 5. Create Assessment
    assess_resp = await client.post(
        "/api/v1/college/assessment",
        headers=headers,
        json={
            "department_id": dept_data["id"],
            "batch_id": batch_data["id"],
            "title": "Placement Technical Assessment 2027",
            "description": "DSA & Aptitude Speedrun",
            "assessment_type": "HYBRID",
            "duration_minutes": 60,
            "pass_marks": 10,
            "total_marks": 20,
            "questions": [
                {
                    "question_type": "MCQ",
                    "skill_category": "Algorithms",
                    "question_text": "What is the time complexity of QuickSort average case?",
                    "options": ["O(N log N)", "O(N^2)", "O(N)", "O(1)"],
                    "correct_option": "O(N log N)",
                    "marks": 10,
                },
                {
                    "question_type": "CODING",
                    "question_text": "Write a function to return maximum subarray sum.",
                    "coding_starter_code": "def max_subarray(nums):\n    pass",
                    "marks": 10,
                }
            ],
        },
    )
    assert assess_resp.status_code == 200
    assess_data = assess_resp.json()
    assert assess_data["title"] == "Placement Technical Assessment 2027"

    # 6. View College Dashboard Analytics
    dash_resp = await client.get("/api/v1/college/dashboard", headers=headers)
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()
    assert dash_data["college_name"] == payload["name"]
    assert "skill_distribution" in dash_data
    assert "weak_areas" in dash_data
    assert dash_data["total_students"] == 0
    assert dash_data["active_students"] == 0
    assert dash_data["assessment_participation_rate"] == 0
    assert dash_data["average_performance_score"] == 0
    assert dash_data["pass_rate"] == 0
    assert dash_data["skill_distribution"] == []
    assert dash_data["weak_areas"] == []
    assert dash_data["department_analytics"] == [
        {
            "department_name": "Computer Science & Engineering",
            "total_students": 0,
            "avg_performance": 0,
            "pass_rate": 0,
        }
    ]

    student_email = f"student_{unique_id.lower()}@example.com"
    student_resp = await client.post(
        "/auth/register",
        json={
            "username": f"student_{unique_id.lower()}",
            "email": student_email,
            "full_name": "Placement Test Student",
            "password": "StudentPass#123",
        },
    )
    assert student_resp.status_code == 201, student_resp.text

    enroll_resp = await client.post(
        "/api/v1/college/student/add",
        headers=headers,
        json={
            "user_email_or_username": student_email,
            "department_id": dept_data["id"],
            "batch_id": batch_data["id"],
            "roll_number": "QA-001",
        },
    )
    assert enroll_resp.status_code == 200, enroll_resp.text
    assert enroll_resp.json()["full_name"] == "Placement Test Student"
    assert enroll_resp.json()["department_name"] == "Computer Science & Engineering"
    assert enroll_resp.json()["batch_name"] == "Batch 2023-2027"

    roster_resp = await client.get("/api/v1/college/students", headers=headers)
    assert roster_resp.status_code == 200, roster_resp.text
    assert [student["email"] for student in roster_resp.json()] == [student_email]

    updated_dashboard = await client.get("/api/v1/college/dashboard", headers=headers)
    assert updated_dashboard.status_code == 200, updated_dashboard.text
    assert updated_dashboard.json()["total_students"] == 1
    assert updated_dashboard.json()["active_students"] == 1

    student_login = await client.post(
        "/auth/login",
        json={"email": student_email, "password": "StudentPass#123"},
    )
    assert student_login.status_code == 200, student_login.text
    student_headers = {
        "Authorization": f"Bearer {student_login.json()['tokens']['access_token']}"
    }
    assigned_resp = await client.get(
        "/api/v1/college/student/my-assessments",
        headers=student_headers,
    )
    assert assigned_resp.status_code == 200, assigned_resp.text
    assigned_assessment = next(
        item for item in assigned_resp.json() if item["id"] == assess_data["id"]
    )
    mcq_question = next(
        question for question in assigned_assessment["questions"]
        if question["question_type"] == "MCQ"
    )
    assert mcq_question["skill_category"] == "Algorithms"
    assert "correct_option" not in mcq_question

    submission_resp = await client.post(
        "/api/v1/college/student/assessment/submit",
        headers=student_headers,
        json={
            "assessment_id": assess_data["id"],
            "answers": {f"q_{mcq_question['id']}": "O(N log N)"},
        },
    )
    assert submission_resp.status_code == 200, submission_resp.text
    assert submission_resp.json()["percentage"] == 50

    skill_profile_resp = await client.get(
        "/api/v1/profile/skill-profile",
        headers=student_headers,
    )
    assert skill_profile_resp.status_code == 200, skill_profile_resp.text
    profile_data = skill_profile_resp.json()
    algorithms = next(skill for skill in profile_data["skills"] if skill["skill"] == "Algorithms")
    assert algorithms["score"] == 100
    assert algorithms["attempts"] == 1
    assert algorithms["sources"] == ["college_assessment"]
    assert profile_data["assessment_performance"][0]["score"] == 50

    forged_profile_resp = await client.post(
        "/api/v1/profile/skill-profile",
        headers=student_headers,
        json={"skills": [{"skill": "Python", "score": 100, "verified": True}]},
    )
    assert forged_profile_resp.status_code == 405


@pytest.mark.asyncio
async def test_student_role_isolation(client: AsyncClient):
    """Verify students cannot access college administration endpoints."""
    resp = await client.get("/api/v1/college/dashboard")
    assert resp.status_code in [401, 403]


@pytest.mark.asyncio
async def test_college_registration_cannot_repurpose_existing_student(client: AsyncClient):
    unique_id = uuid4().hex[:8].lower()
    email = f"existing_student_{unique_id}@example.com"
    password = "StudentPass#123"

    registration = await client.post(
        "/auth/register",
        json={
            "username": f"existing_student_{unique_id}",
            "email": email,
            "full_name": "Existing Student",
            "password": password,
        },
    )
    assert registration.status_code == 201, registration.text

    college_registration = await client.post(
        "/api/v1/college/register",
        json={
            "name": f"Test Institution {unique_id}",
            "code": f"TST_{unique_id.upper()}",
            "admin_name": "Untrusted Registrant",
            "admin_email": email,
            "admin_password": "DifferentPass#456",
        },
    )
    assert college_registration.status_code == 409, college_registration.text

    login = await client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )
    assert login.status_code == 200, login.text
    assert login.json()["user"]["account_type"] == "STUDENT"
    assert login.json()["user"]["role"] == "student"
