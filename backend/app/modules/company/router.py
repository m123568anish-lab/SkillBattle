from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_admin, get_current_user
from app.database.session import get_db
from app.models.company import JobPosting
from app.models.user import User
from app.models.battle.battle_config import BattleConfig
from app.modules.company.schemas import CandidateApplicationConsentRequest, CandidateApplicationRequest, CandidateApplicationStatusRequest, CompanyAssessmentCreate, CompanyDashboardResponse, CompanyRegisterRequest, CompanyStatusRequest, CompanySummary, JobPostingRequest, JobPostingResponse
from app.modules.battle.schemas import BattleConfigResponse, BattleResponse, CreateBattleRequest
from app.modules.battle.service import battle_service
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
            assessment_config_id=await company_service.get_job_assessment_config_id(db, current_user, job.id),
        )
        for job in jobs
    ]


@router.post("/jobs/{job_id}/assessment", response_model=BattleConfigResponse)
async def create_job_assessment(
    job_id: int,
    payload: CompanyAssessmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    config = await company_service.create_job_assessment(db, current_user, job_id, payload.model_dump())
    return config


@router.get("/openings")
async def list_openings(db: AsyncSession = Depends(get_db)):
    return await company_service.list_openings(db)


@router.get("/my-applications")
async def list_my_applications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await company_service.list_user_applications(db, current_user)


@router.put("/my-applications/{application_id}/consent")
async def update_application_consent(
    application_id: int,
    payload: CandidateApplicationConsentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = await company_service.update_application_consent(
        db, current_user, application_id, payload.consent_to_recruiters
    )
    return {"application_id": application.id, "consent_to_recruiters": application.consent_to_recruiters}


@router.post("/my-applications/{application_id}/assessment/start", response_model=BattleResponse)
async def start_application_assessment(
    application_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = await company_service.get_application_for_student(db, current_user, application_id)
    result = await db.execute(
        select(JobPosting).where(JobPosting.id == application.job_id)
    )
    job = result.scalar_one()
    config_result = await db.execute(select(BattleConfig).where(BattleConfig.job_id == job.id))
    config = config_result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail="This job has no company assessment.")
    try:
        battle = await battle_service.create_battle(
            db,
            current_user,
            CreateBattleRequest(
                title=f"{job.title} assessment",
                difficulty=config.difficulty,
                config_id=config.id,
                battle_type="company",
                max_players=1,
            ),
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    if battle.questions_data:
        from app.modules.battle.question_engine import question_engine

        battle.questions_data = question_engine.sanitize_sections_for_client(
            battle.questions_data,
            current_section_index=battle.current_section_index,
            is_completed=False,
        )
    return battle


@router.patch("/applications/{application_id}/status")
async def update_application_status(
    application_id: int,
    payload: CandidateApplicationStatusRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = await company_service.update_application_status(
        db, current_user, application_id, payload.status
    )
    return {"application_id": application.id, "status": application.status}


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


@router.get("/discover")
async def discover_candidates(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await company_service.discover_candidates(db, current_user, job_id)


@router.get("/admin/companies/pending", response_model=list[CompanySummary])
async def list_pending_companies(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    companies = await company_service.list_pending_companies(db)
    return [
        CompanySummary(
            id=company.id,
            name=company.name,
            slug=company.slug,
            industry=company.industry,
            website=company.website,
            headquarters=company.headquarters,
            status=company.status,
        )
        for company in companies
    ]


@router.patch("/admin/companies/{company_id}/status", response_model=CompanySummary)
async def update_company_status(
    company_id: int,
    payload: CompanyStatusRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    company = await company_service.update_company_status(db, company_id, payload.status)
    return CompanySummary(
        id=company.id,
        name=company.name,
        slug=company.slug,
        industry=company.industry,
        website=company.website,
        headquarters=company.headquarters,
        status=company.status,
    )
