from __future__ import annotations

from urllib.parse import quote

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.battle.battle_room import BattleRoom
from app.models.college import Batch, College, CollegeAssessment, CollegeStudent, Department
from app.models.company import (
    CandidateApplication,
    CandidatePrivacySettings,
    Company,
    CompanyMember,
    JobPosting,
)
from app.models.problem import Problem
from app.models.question import Question
from app.models.user import User

router = APIRouter(prefix="/search", tags=["Global Search"])


class SearchResult(BaseModel):
    type: str
    title: str
    detail: str
    href: str


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]


def _like(value: str) -> str:
    escaped = value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


@router.get("", response_model=SearchResponse)
async def global_search(
    q: str = Query(min_length=2, max_length=100),
    limit: int = Query(default=6, ge=1, le=10),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SearchResponse:
    query = q.strip()
    if len(query) < 2:
        return SearchResponse(query=query, results=[])
    pattern = _like(query)
    results: list[SearchResult] = []

    question_rows = await db.execute(
        select(Question.id, Question.title, Question.difficulty)
        .where(
            Question.is_active.is_(True),
            or_(Question.title.ilike(pattern, escape="\\"), Question.description.ilike(pattern, escape="\\")),
        )
        .order_by(Question.title)
        .limit(limit)
    )
    results.extend(
        SearchResult(
            type="practice",
            title=row.title,
            detail=f"{row.difficulty} practice question",
            href=f"/challenge?question={quote(str(row.id))}",
        )
        for row in question_rows
    )

    problem_rows = await db.execute(
        select(Problem.id, Problem.title, Problem.difficulty)
        .where(
            Problem.is_active.is_(True),
            or_(Problem.title.ilike(pattern, escape="\\"), Problem.description.ilike(pattern, escape="\\")),
        )
        .order_by(Problem.title)
        .limit(limit)
    )
    results.extend(
        SearchResult(
            type="problem",
            title=row.title,
            detail=f"{row.difficulty} coding problem",
            href=f"/challenge?problem={quote(str(row.id))}",
        )
        for row in problem_rows
    )

    public_jobs = await db.execute(
        select(JobPosting.id, JobPosting.title, JobPosting.location, Company.name)
        .join(Company, Company.id == JobPosting.company_id)
        .where(
            JobPosting.status.in_(["open", "active"]),
            Company.status == "verified",
            or_(JobPosting.title.ilike(pattern, escape="\\"), JobPosting.required_skills.ilike(pattern, escape="\\")),
        )
        .order_by(JobPosting.created_at.desc())
        .limit(limit)
    )
    results.extend(
        SearchResult(
            type="job",
            title=row.title,
            detail=f"{row.name} · {row.location or 'Location flexible'}",
            href=f"/career/dashboard?job_id={row.id}",
        )
        for row in public_jobs
    )

    battle_rows = await db.execute(
        select(BattleRoom.id, BattleRoom.title, BattleRoom.difficulty)
        .where(
            BattleRoom.status == "waiting",
            BattleRoom.company_id.is_(None),
            BattleRoom.college_id.is_(None),
            BattleRoom.title.ilike(pattern, escape="\\"),
        )
        .order_by(BattleRoom.created_at.desc())
        .limit(limit)
    )
    results.extend(
        SearchResult(
            type="battle",
            title=row.title,
            detail=f"Open battle · {row.difficulty}",
            href=f"/battle/{quote(str(row.id))}",
        )
        for row in battle_rows
    )

    account_type = (current_user.account_type or "").upper()
    role = (current_user.requested_role or current_user.role or "").upper()

    if account_type == "COLLEGE" or role in {"COLLEGE_ADMIN", "PLACEMENT_ADMIN", "FACULTY", "TRAINER"}:
        college_result = await db.execute(
            select(College.id).where(College.admin_user_id == current_user.id)
        )
        college_ids = list(college_result.scalars().all())
        if not college_ids:
            membership_result = await db.execute(
                select(CollegeStudent.college_id).where(CollegeStudent.user_id == current_user.id)
            )
            college_ids = list(membership_result.scalars().all())
        college_ids = list(set(college_ids))

        if college_ids:
            student_rows = await db.execute(
                select(User.id, User.full_name, CollegeStudent.roll_number)
                .join(CollegeStudent, CollegeStudent.user_id == User.id)
                .where(
                    CollegeStudent.college_id.in_(college_ids),
                    or_(User.full_name.ilike(pattern, escape="\\"), User.username.ilike(pattern, escape="\\")),
                )
                .order_by(User.full_name)
                .limit(limit)
            )
            results.extend(
                SearchResult(
                    type="student",
                    title=row.full_name,
                    detail=f"Student · {row.roll_number or 'No roll number'}",
                    href="/dashboard",
                )
                for row in student_rows
            )

            assessment_rows = await db.execute(
                select(CollegeAssessment.id, CollegeAssessment.title, CollegeAssessment.status)
                .where(
                    CollegeAssessment.college_id.in_(college_ids),
                    CollegeAssessment.title.ilike(pattern, escape="\\"),
                )
                .order_by(CollegeAssessment.created_at.desc())
                .limit(limit)
            )
            results.extend(
                SearchResult(
                    type="assessment",
                    title=row.title,
                    detail=f"College assessment · {row.status}",
                    href="/dashboard",
                )
                for row in assessment_rows
            )

            department_rows = await db.execute(
                select(Department.id, Department.name, Department.code)
                .where(
                    Department.college_id.in_(college_ids),
                    or_(Department.name.ilike(pattern, escape="\\"), Department.code.ilike(pattern, escape="\\")),
                )
                .order_by(Department.name)
                .limit(limit)
            )
            results.extend(
                SearchResult(
                    type="department",
                    title=row.name,
                    detail=f"Department · {row.code}",
                    href="/dashboard",
                )
                for row in department_rows
            )

            batch_rows = await db.execute(
                select(Batch.id, Batch.name, Batch.passout_year)
                .where(Batch.college_id.in_(college_ids), Batch.name.ilike(pattern, escape="\\"))
                .order_by(Batch.passout_year.desc())
                .limit(limit)
            )
            results.extend(
                SearchResult(
                    type="batch",
                    title=row.name,
                    detail=f"Batch · class of {row.passout_year}",
                    href="/dashboard",
                )
                for row in batch_rows
            )

    if account_type == "COMPANY" or role in {"COMPANY_ADMIN", "RECRUITER", "HIRING_MANAGER"}:
        company_result = await db.execute(
            select(CompanyMember.company_id).where(
                CompanyMember.user_id == current_user.id,
                CompanyMember.status == "active",
            )
        )
        company_ids = list(set(company_result.scalars().all()))

        if company_ids:
            company_job_rows = await db.execute(
                select(JobPosting.id, JobPosting.title, JobPosting.status)
                .where(
                    JobPosting.company_id.in_(company_ids),
                    JobPosting.title.ilike(pattern, escape="\\"),
                )
                .order_by(JobPosting.updated_at.desc())
                .limit(limit)
            )
            results.extend(
                SearchResult(
                    type="company_job",
                    title=row.title,
                    detail=f"Your job · {row.status}",
                    href=f"/company/dashboard?job_id={row.id}",
                )
                for row in company_job_rows
            )

            candidate_rows = await db.execute(
                select(User.id, User.full_name, JobPosting.title)
                .join(CandidateApplication, CandidateApplication.candidate_user_id == User.id)
                .join(JobPosting, JobPosting.id == CandidateApplication.job_id)
                .join(CandidatePrivacySettings, CandidatePrivacySettings.user_id == User.id)
                .where(
                    JobPosting.company_id.in_(company_ids),
                    CandidateApplication.consent_to_recruiters.is_(True),
                    CandidatePrivacySettings.allow_recruiter_search.is_(True),
                    User.full_name.ilike(pattern, escape="\\"),
                )
                .order_by(CandidateApplication.created_at.desc())
                .limit(limit)
            )
            results.extend(
                SearchResult(
                    type="candidate",
                    title=row.full_name,
                    detail=f"Consented applicant · {row.title}",
                    href=f"/company/dashboard?candidate_id={quote(str(row.id))}",
                )
                for row in candidate_rows
            )

    return SearchResponse(query=query, results=results[: limit * 6])