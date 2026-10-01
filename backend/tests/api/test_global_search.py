from __future__ import annotations

from types import SimpleNamespace
from uuid import uuid4

import pytest
from sqlalchemy import delete

from app.core.dependencies import get_current_user
from app.database.session import AsyncSessionLocal, get_db
from app.main import app
from app.models.company import (
    CandidateApplication,
    CandidatePrivacySettings,
    Company,
    CompanyMember,
    JobPosting,
)
from app.models.user import User


@pytest.mark.asyncio
async def test_company_search_only_returns_its_jobs_and_consented_candidates(client):
    recruiter_id = str(uuid4())
    other_recruiter_id = str(uuid4())
    candidate_id = str(uuid4())
    other_candidate_id = str(uuid4())
    company_id = None
    other_company_id = None

    async def override_db():
        async with AsyncSessionLocal() as session:
            yield session

    async def override_current_user():
        return SimpleNamespace(
            id=recruiter_id,
            account_type="COMPANY",
            requested_role="RECRUITER",
            role="student",
        )

    previous_overrides = app.dependency_overrides.copy()
    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_current_user

    try:
        async with AsyncSessionLocal() as session:
            recruiter = User(
                id=recruiter_id,
                username=f"search-{recruiter_id[:12]}",
                full_name="Search Recruiter",
                email=f"{recruiter_id}@example.test",
                password_hash="test-only-hash",
            )
            other_recruiter = User(
                id=other_recruiter_id,
                username=f"search-{other_recruiter_id[:12]}",
                full_name="Other Recruiter",
                email=f"{other_recruiter_id}@example.test",
                password_hash="test-only-hash",
            )
            candidate = User(
                id=candidate_id,
                username=f"search-{candidate_id[:12]}",
                full_name="Private Search Candidate",
                email=f"{candidate_id}@example.test",
                password_hash="test-only-hash",
            )
            other_candidate = User(
                id=other_candidate_id,
                username=f"search-{other_candidate_id[:12]}",
                full_name="Private Search Candidate Hidden",
                email=f"{other_candidate_id}@example.test",
                password_hash="test-only-hash",
            )
            company = Company(name="Company One", slug=f"company-one-{recruiter_id[:8]}", status="verified")
            other_company = Company(name="Company Two", slug=f"company-two-{other_recruiter_id[:8]}", status="verified")
            session.add_all([recruiter, other_recruiter, candidate, other_candidate, company, other_company])
            await session.flush()
            company_id = company.id
            other_company_id = other_company.id
            session.add_all(
                [
                    CompanyMember(company_id=company.id, user_id=recruiter.id, role="recruiter", status="active"),
                    CompanyMember(company_id=other_company.id, user_id=other_recruiter.id, role="recruiter", status="active"),
                ]
            )
            own_job = JobPosting(company_id=company.id, title="Private Platform Engineer", status="draft")
            other_job = JobPosting(company_id=other_company.id, title="Private Platform Engineer Hidden", status="draft")
            session.add_all([own_job, other_job])
            await session.flush()
            session.add_all(
                [
                    CandidateApplication(job_id=own_job.id, candidate_user_id=candidate.id, consent_to_recruiters=True),
                    CandidateApplication(job_id=other_job.id, candidate_user_id=other_candidate.id, consent_to_recruiters=True),
                    CandidatePrivacySettings(user_id=candidate.id, allow_recruiter_search=True),
                    CandidatePrivacySettings(user_id=other_candidate.id, allow_recruiter_search=True),
                ]
            )
            await session.commit()

        response = await client.get("/api/v1/search", params={"q": "Private"})
        assert response.status_code == 200
        results = response.json()["results"]
        result_titles = {result["title"] for result in results}
        assert "Private Platform Engineer" in result_titles
        assert "Private Search Candidate" in result_titles
        assert "Private Platform Engineer Hidden" not in result_titles
        assert "Private Search Candidate Hidden" not in result_titles
    finally:
        async with AsyncSessionLocal() as session:
            await session.execute(
                delete(CandidateApplication).where(
                    CandidateApplication.candidate_user_id.in_([candidate_id, other_candidate_id])
                )
            )
            await session.execute(
                delete(CandidatePrivacySettings).where(
                    CandidatePrivacySettings.user_id.in_([candidate_id, other_candidate_id])
                )
            )
            await session.execute(
                delete(JobPosting).where(JobPosting.company_id.in_([company_id, other_company_id]))
            )
            await session.execute(
                delete(CompanyMember).where(CompanyMember.user_id.in_([recruiter_id, other_recruiter_id]))
            )
            await session.execute(
                delete(Company).where(Company.id.in_([company_id, other_company_id]))
            )
            await session.execute(
                delete(User).where(
                    User.id.in_([recruiter_id, other_recruiter_id, candidate_id, other_candidate_id])
                )
            )
            await session.commit()
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous_overrides)