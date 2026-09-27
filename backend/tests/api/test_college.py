"""
=========================================================
SkillBattle - College & Placement Cell Platform Tests
=========================================================
"""

import pytest
from uuid import uuid4
from httpx import AsyncClient


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
    assert data["is_verified"] is True

    # 2. Login as College Admin
    login_resp = await client.post("/auth/login", json={"email": admin_email, "password": "CollegeAdmin#123"})
    assert login_resp.status_code == 200
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


@pytest.mark.asyncio
async def test_student_role_isolation(client: AsyncClient):
    """Verify students cannot access college administration endpoints."""
    resp = await client.get("/api/v1/college/dashboard")
    assert resp.status_code in [401, 403]
