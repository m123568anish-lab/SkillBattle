from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company import CandidateApplication, Company, CompanyMember, JobPosting
from app.models.profile import Profile
from app.models.user import User


class CompanyService:
    async def register_company(self, db: AsyncSession, user: User, payload: dict[str, Any]) -> Company:
        if not user or not getattr(user, "id", None):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")

        existing_membership = await db.execute(select(CompanyMember).where(CompanyMember.user_id == user.id))
        if existing_membership.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This account is already connected to a company.")

        raw_slug = (payload.get("slug") or payload.get("name") or "").strip().lower().replace(" ", "-")
        if not raw_slug:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A valid company slug is required.")

        company = Company(
            name=str(payload["name"]).strip(),
            slug=raw_slug,
            industry=(payload.get("industry") or "").strip(),
            website=(payload.get("website") or "").strip(),
            headquarters=(payload.get("headquarters") or "").strip(),
            description=(payload.get("description") or "").strip(),
            status="verified",
            created_by_user_id=user.id,
        )
        db.add(company)
        await db.flush()

        membership = CompanyMember(company_id=company.id, user_id=user.id, role="company_admin", status="active")
        db.add(membership)
        user.role = "company_admin"
        await db.commit()
        await db.refresh(company)
        return company

    async def get_company_for_user(self, db: AsyncSession, user: User) -> Company | None:
        stmt = select(CompanyMember).where(CompanyMember.user_id == user.id)
        result = await db.execute(stmt)
        membership = result.scalar_one_or_none()
        if not membership:
            return None
        stmt_company = select(Company).where(Company.id == membership.company_id)
        company_result = await db.execute(stmt_company)
        return company_result.scalar_one_or_none()

    async def create_job(self, db: AsyncSession, user: User, payload: dict[str, Any]) -> JobPosting:
        company = await self.get_company_for_user(db, user)
        if not company:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Company access required.")

        job = JobPosting(
            company_id=company.id,
            created_by_user_id=user.id,
            title=str(payload["title"]).strip(),
            location=(payload.get("location") or "").strip(),
            employment_type=(payload.get("employment_type") or "full_time").strip(),
            remote_allowed=bool(payload.get("remote_allowed", False)),
            description=(payload.get("description") or "").strip(),
            required_skills=(payload.get("required_skills") or "").strip(),
            compensation=(payload.get("compensation") or "").strip(),
            status=(payload.get("status") or "draft").strip(),
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)
        return job

    async def list_jobs(self, db: AsyncSession, user: User) -> list[JobPosting]:
        company = await self.get_company_for_user(db, user)
        if not company:
            return []
        stmt = select(JobPosting).where(JobPosting.company_id == company.id).order_by(JobPosting.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def list_candidates(self, db: AsyncSession, user: User, job_id: int | None = None) -> list[dict[str, Any]]:
        company = await self.get_company_for_user(db, user)
        if not company:
            return []

        stmt = select(CandidateApplication, User, Profile, JobPosting).join(JobPosting, JobPosting.id == CandidateApplication.job_id).join(User, User.id == CandidateApplication.candidate_user_id).outerjoin(Profile, Profile.user_id == User.id).where(JobPosting.company_id == company.id)
        if job_id is not None:
            stmt = stmt.where(JobPosting.id == job_id)
        stmt = stmt.order_by(CandidateApplication.created_at.desc())
        result = await db.execute(stmt)

        rows: list[dict[str, Any]] = []
        for application, candidate, profile, posting in result.all():
            consented = application.consent_to_recruiters
            rows.append(
                {
                    "application_id": application.id,
                    "job_id": posting.id,
                    "job_title": posting.title,
                    "candidate_id": candidate.id if consented else None,
                    "candidate_name": candidate.full_name if consented else "Private candidate",
                    "candidate_email": candidate.email if consented else "",
                    "status": application.status,
                    "score": application.score,
                    "consent": consented,
                    "target_company": (profile.target_company if consented and profile else ""),
                    "github": (profile.github if consented and profile else ""),
                    "linkedin": (profile.linkedin if consented and profile else ""),
                }
            )
        return rows

    async def get_dashboard(self, db: AsyncSession, user: User) -> dict[str, Any]:
        company = await self.get_company_for_user(db, user)
        if not company:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Company access required.")

        jobs = await self.list_jobs(db, user)
        candidate_rows = await self.list_candidates(db, user)
        shortlisted_total = sum(1 for item in candidate_rows if item["status"] == "shortlisted")

        return {
            "company": {
                "id": company.id,
                "name": company.name,
                "slug": company.slug,
                "industry": company.industry,
                "website": company.website,
                "headquarters": company.headquarters,
                "status": company.status,
            },
            "jobs_total": len(jobs),
            "active_jobs": sum(1 for job in jobs if job.status in {"draft", "open", "active"}),
            "candidates_total": len(candidate_rows),
            "shortlisted_total": shortlisted_total,
            "recent_applications": [
                {
                    "candidate": item["candidate_name"],
                    "job": item["job_title"],
                    "status": item["status"],
                    "score": item["score"],
                }
                for item in candidate_rows[:5]
            ],
        }

    async def submit_application(self, db: AsyncSession, user: User, payload: dict[str, Any]) -> CandidateApplication:
        if not user or not getattr(user, "id", None):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
        if getattr(user, "role", "user") not in {"student", "user"}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only student accounts can apply to jobs.")

        stmt = select(JobPosting).where(JobPosting.id == payload["job_id"])
        result = await db.execute(stmt)
        job = result.scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

        existing = await db.execute(
            select(CandidateApplication).where(
                CandidateApplication.job_id == job.id,
                CandidateApplication.candidate_user_id == user.id,
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You have already applied to this job.")

        application = CandidateApplication(
            job_id=job.id,
            candidate_user_id=user.id,
            source="platform",
            status="applied",
            score=0,
            consent_to_recruiters=bool(payload.get("consent_to_recruiters", False)),
        )
        db.add(application)
        await db.commit()
        await db.refresh(application)
        return application


company_service = CompanyService()
