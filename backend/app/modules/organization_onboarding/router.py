from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.battle.battle_config import BattleConfig
from app.models.college import (
    Batch,
    CollegeAssessment,
    CollegeStudent,
    Department,
)
from app.models.company import (
    CandidateApplication,
    CompanyMember,
    JobPosting,
)
from app.models.user import User
from app.modules.college.service import college_service
from app.modules.company.service import company_service

router = APIRouter(prefix="/organization-onboarding", tags=["Organization Onboarding"])


def _progress(steps: list[dict]) -> dict:
    available = [step for step in steps if step["available"]]
    completed = sum(step["complete"] for step in available)
    return {
        "steps": steps,
        "completed_steps": completed,
        "available_steps": len(available),
        "progress_percent": round(completed / len(available) * 100) if available else 0,
    }


@router.get("/progress")
async def get_organization_onboarding_progress(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account_type = (current_user.account_type or "").upper()
    role = (current_user.requested_role or current_user.role or "").upper()

    if account_type == "COLLEGE" or role in {"COLLEGE_ADMIN", "PLACEMENT_ADMIN", "FACULTY", "TRAINER"}:
        college = await college_service.get_user_college(db, current_user)
        if college is None:
            raise HTTPException(status_code=404, detail="No college is linked to this account.")

        department_count = await db.scalar(
            select(func.count()).select_from(Department).where(Department.college_id == college.id)
        )
        batch_count = await db.scalar(
            select(func.count()).select_from(Batch).where(Batch.college_id == college.id)
        )
        student_count = await db.scalar(
            select(func.count()).select_from(CollegeStudent).where(CollegeStudent.college_id == college.id)
        )
        assessment_count = await db.scalar(
            select(func.count()).select_from(CollegeAssessment).where(CollegeAssessment.college_id == college.id)
        )
        return {
            "organization_type": "college",
            "organization_id": college.id,
            "organization_name": college.name,
            **_progress([
                {"key": "profile", "title": "College profile", "available": True, "complete": bool(college.name and college.code), "count": 1},
                {"key": "verification", "title": "Verification", "available": True, "complete": bool(college.is_verified), "count": int(college.is_verified)},
                {"key": "departments", "title": "Departments", "available": True, "complete": bool(department_count), "count": int(department_count or 0)},
                {"key": "batches", "title": "Batches", "available": True, "complete": bool(batch_count), "count": int(batch_count or 0)},
                {"key": "students", "title": "Students", "available": True, "complete": bool(student_count), "count": int(student_count or 0)},
                {"key": "assessments", "title": "First assessment", "available": True, "complete": bool(assessment_count), "count": int(assessment_count or 0)},
                {"key": "training", "title": "Training programs", "available": False, "complete": False, "count": None},
                {"key": "placement", "title": "Placement drives", "available": False, "complete": False, "count": None},
            ]),
        }

    if account_type == "COMPANY" or role in {"COMPANY_ADMIN", "RECRUITER", "HIRING_MANAGER"}:
        company = await company_service.get_company_for_user(db, current_user)
        if company is None:
            raise HTTPException(status_code=404, detail="No company is linked to this account.")

        team_count = await db.scalar(
            select(func.count()).select_from(CompanyMember).where(
                CompanyMember.company_id == company.id,
                CompanyMember.status == "active",
            )
        )
        job_count = await db.scalar(
            select(func.count()).select_from(JobPosting).where(JobPosting.company_id == company.id)
        )
        skills_job_count = await db.scalar(
            select(func.count()).select_from(JobPosting).where(
                JobPosting.company_id == company.id,
                JobPosting.required_skills.is_not(None),
                func.length(func.trim(JobPosting.required_skills)) > 0,
            )
        )
        assessment_count = await db.scalar(
            select(func.count()).select_from(BattleConfig).where(BattleConfig.company_id == company.id)
        )
        candidate_count = await db.scalar(
            select(func.count())
            .select_from(CandidateApplication)
            .join(JobPosting, JobPosting.id == CandidateApplication.job_id)
            .where(JobPosting.company_id == company.id)
        )
        return {
            "organization_type": "company",
            "organization_id": company.id,
            "organization_name": company.name,
            **_progress([
                {"key": "profile", "title": "Company profile", "available": True, "complete": bool(company.name and company.slug), "count": 1},
                {"key": "verification", "title": "Verification", "available": True, "complete": company.status == "verified", "count": int(company.status == "verified")},
                {"key": "team", "title": "Team", "available": True, "complete": int(team_count or 0) > 1, "count": int(team_count or 0)},
                {"key": "job", "title": "First job", "available": True, "complete": bool(job_count), "count": int(job_count or 0)},
                {"key": "skills", "title": "Required skills", "available": True, "complete": bool(skills_job_count), "count": int(skills_job_count or 0)},
                {"key": "assessment", "title": "First assessment", "available": True, "complete": bool(assessment_count), "count": int(assessment_count or 0)},
                {"key": "candidates", "title": "Candidate activity", "available": True, "complete": bool(candidate_count), "count": int(candidate_count or 0)},
                {"key": "interviews", "title": "Interview workflow", "available": False, "complete": False, "count": None},
            ]),
        }

    raise HTTPException(status_code=403, detail="Organization onboarding is available to college and company accounts.")