from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.modules.company.schemas import CandidateApplicationRequest, CompanyDashboardResponse, CompanyRegisterRequest, CompanySummary, JobPostingRequest, JobPostingResponse
from app.modules.company.service import company_service

router = APIRouter(prefix="/company", tags=["Company Platform"])


@router.get("/health")
async def health() -> dict[str, str]:
    return {"module": "company", "status": "healthy"}


@router.post("/register", response_model=CompanySummary)
async def register_company(
    payload: CompanyRegisterRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company = await company_service.register_company(db, current_user, payload.model_dump())
    return CompanySummary(
        id=company.id,
        name=company.name,
        slug=company.slug,
        industry=company.industry,
        website=company.website,
        headquarters=company.headquarters,
        status=company.status,
    )


@router.get("/me", response_model=CompanySummary | None)
async def get_my_company(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company = await company_service.get_company_for_user(db, current_user)
    if not company:
        return None
    return CompanySummary(
        id=company.id,
        name=company.name,
        slug=company.slug,
        industry=company.industry,
        website=company.website,
        headquarters=company.headquarters,
        status=company.status,
    )


@router.get("/dashboard", response_model=CompanyDashboardResponse)
async def dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = await company_service.get_dashboard(db, current_user)
    return CompanyDashboardResponse(**data)


@router.post("/jobs", response_model=JobPostingResponse)
async def create_job(
    payload: JobPostingRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = await company_service.create_job(db, current_user, payload.model_dump())
    return JobPostingResponse(
        id=job.id,
        company_id=job.company_id,
        title=job.title,
        location=job.location,
        employment_type=job.employment_type,
        remote_allowed=job.remote_allowed,
        description=job.description,
        required_skills=job.required_skills,
        compensation=job.compensation,
        status=job.status,
    )


@router.get("/jobs", response_model=list[JobPostingResponse])
async def list_jobs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    jobs = await company_service.list_jobs(db, current_user)
    return [
        JobPostingResponse(
            id=job.id,
            company_id=job.company_id,
            title=job.title,
            location=job.location,
            employment_type=job.employment_type,
            remote_allowed=job.remote_allowed,
            description=job.description,
            required_skills=job.required_skills,
            compensation=job.compensation,
            status=job.status,
        )
        for job in jobs
    ]


@router.post("/applications")
async def submit_application(
    payload: CandidateApplicationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = await company_service.submit_application(db, current_user, payload.model_dump())
    return {"status": "applied", "application_id": application.id, "job_id": application.job_id}


@router.get("/candidates")
async def list_candidates(
    job_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await company_service.list_candidates(db, current_user, job_id)
