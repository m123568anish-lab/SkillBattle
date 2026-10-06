from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company import CandidateApplication, CandidatePrivacySettings, Company, CompanyInterview, CompanyMember, JobPosting
from app.models.profile import Profile
from app.models.skill_intelligence import SkillEvidence
from app.models.user import User
from app.models.battle.battle_config import BattleConfig
from app.modules.battle.config.service import battle_config_service
from app.modules.battle.schemas import BattleConfigCreate, BattleTypeEnum
from app.modules.profile.skill_profile_service import skill_profile_service
from app.modules.notification.service import notification_service
from app.modules.audit.service import audit_service
from app.modules.skill_intelligence.service import normalize_skill_id


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

        user.account_type = "COMPANY"
        user.requested_role = "COMPANY_ADMIN"
        user.role = "student"
        user.status = "PENDING_VERIFICATION"
        user.is_verified = False

        company = Company(
            name=str(payload["name"]).strip(),
            slug=raw_slug,
            industry=(payload.get("industry") or "").strip(),
            website=(payload.get("website") or "").strip(),
            headquarters=(payload.get("headquarters") or "").strip(),
            description=(payload.get("description") or "").strip(),
            status="pending",
            created_by_user_id=user.id,
        )
        db.add(company)
        await db.flush()

        membership = CompanyMember(company_id=company.id, user_id=user.id, role="company_admin", status="active")
        db.add(membership)
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
        if not company or company.status != "verified":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verified company access required.")
        if company.status != "verified":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Company verification is required before posting jobs.")

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

    async def create_job_assessment(
        self,
        db: AsyncSession,
        user: User,
        job_id: int,
        payload: dict[str, Any],
    ) -> BattleConfig:
        company = await self.get_company_for_user(db, user)
        if not company or company.status != "verified":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verified company access required.")

        job_result = await db.execute(
            select(JobPosting).where(JobPosting.id == job_id, JobPosting.company_id == company.id)
        )
        job = job_result.scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found for this company.")

        existing = await db.execute(select(BattleConfig).where(BattleConfig.job_id == job.id))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This job already has an assessment.")

        config = BattleConfigCreate(
            title=payload["title"],
            description=payload.get("description", ""),
            battle_type=BattleTypeEnum.COMPANY,
            difficulty=payload.get("difficulty", "medium"),
            duration_minutes=payload.get("duration_minutes", 45),
            question_count=payload.get("question_count", 5),
            sections=payload["sections"],
            allowed_languages=payload.get("allowed_languages", ["python", "javascript", "cpp", "java"]),
            scoring_rules=payload.get("scoring_rules", {}),
            negative_marking=payload.get("negative_marking", False),
            visibility="private",
            company_id=company.id,
            job_id=job.id,
        )
        return await battle_config_service.create_config(db, config)

    async def list_openings(self, db: AsyncSession) -> list[dict[str, Any]]:
        stmt = (
            select(JobPosting, Company, BattleConfig.id)
            .join(Company, Company.id == JobPosting.company_id)
            .outerjoin(BattleConfig, BattleConfig.job_id == JobPosting.id)
            .where(Company.status == "verified", JobPosting.status.in_(("open", "active")))
            .order_by(JobPosting.created_at.desc())
        )
        result = await db.execute(stmt)
        return [
            {
                "job_id": job.id,
                "company_id": company.id,
                "company_name": company.name,
                "title": job.title,
                "location": job.location,
                "employment_type": job.employment_type,
                "remote_allowed": job.remote_allowed,
                "description": job.description,
                "required_skills": job.required_skills,
                "assessment_available": assessment_id is not None,
            }
            for job, company, assessment_id in result.all()
        ]

    async def list_user_applications(self, db: AsyncSession, user: User) -> list[dict[str, Any]]:
        stmt = (
            select(CandidateApplication, JobPosting, Company, BattleConfig.id, CompanyInterview)
            .join(JobPosting, JobPosting.id == CandidateApplication.job_id)
            .join(Company, Company.id == JobPosting.company_id)
            .outerjoin(BattleConfig, BattleConfig.job_id == JobPosting.id)
            .outerjoin(CompanyInterview, CompanyInterview.application_id == CandidateApplication.id)
            .where(CandidateApplication.candidate_user_id == user.id)
            .order_by(CandidateApplication.created_at.desc())
        )
        result = await db.execute(stmt)
        return [
            {
                "application_id": application.id,
                "job_id": job.id,
                "company_name": company.name,
                "status": application.status,
                "consent_to_recruiters": application.consent_to_recruiters,
                "assessment_config_id": config_id,
                "assessment_status": application.assessment_status,
                "interview": {
                    "scheduled_at": interview.scheduled_at.replace(tzinfo=timezone.utc).isoformat(),
                    "duration_minutes": interview.duration_minutes,
                    "meeting_url": interview.meeting_url,
                    "notes": interview.notes,
                    "status": interview.status,
                } if interview else None,
            }
            for application, job, company, config_id, interview in result.all()
        ]

    async def get_application_for_student(
        self,
        db: AsyncSession,
        user: User,
        application_id: int,
    ) -> CandidateApplication:
        result = await db.execute(
            select(CandidateApplication).where(
                CandidateApplication.id == application_id,
                CandidateApplication.candidate_user_id == user.id,
            )
        )
        application = result.scalar_one_or_none()
        if not application:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")
        if application.status not in {"applied", "shortlisted"}:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This application is no longer active.")
        return application

    async def update_application_consent(
        self,
        db: AsyncSession,
        user: User,
        application_id: int,
        consent: bool,
    ) -> CandidateApplication:
        application = await self.get_application_for_student(db, user, application_id)
        application.consent_to_recruiters = consent
        await db.commit()
        await db.refresh(application)
        return application

    async def update_application_status(
        self,
        db: AsyncSession,
        user: User,
        application_id: int,
        new_status: str,
    ) -> CandidateApplication:
        company = await self.get_company_for_user(db, user)
        if not company or company.status != "verified":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verified company access required.")
        result = await db.execute(
            select(CandidateApplication)
            .join(JobPosting, JobPosting.id == CandidateApplication.job_id)
            .where(CandidateApplication.id == application_id, JobPosting.company_id == company.id)
        )
        application = result.scalar_one_or_none()
        if not application:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found for this company.")

        transitions = {
            "applied": {"shortlisted", "rejected"},
            "shortlisted": {"rejected"},
            "interview": {"offer", "rejected"},
            "offer": {"hired", "rejected"},
            "hired": set(),
            "rejected": set(),
        }
        if new_status not in transitions.get(application.status, set()):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot move an application from {application.status} to {new_status}.",
            )

        if new_status == "shortlisted":
            visible_candidates = await self.list_candidates(db, user, application.job_id)
            candidate = next((row for row in visible_candidates if row["application_id"] == application_id), None)
            if not candidate or not candidate["consent"] or not candidate["eligible"]:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Candidate has not shared eligible verified skills.")
            if application.assessment_status != "completed":
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Candidate must complete the company assessment before shortlisting.")
            privacy_result = await db.execute(
                select(CandidatePrivacySettings).where(
                    CandidatePrivacySettings.user_id == application.candidate_user_id
                )
            )
            privacy = privacy_result.scalar_one_or_none()
            if not privacy or not privacy.share_assessment_results:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Candidate has not shared assessment results.")

        if new_status == "offer":
            interview_result = await db.execute(
                select(CompanyInterview).where(
                    CompanyInterview.application_id == application.id,
                    CompanyInterview.status == "completed",
                )
            )
            if interview_result.scalar_one_or_none() is None:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Complete an interview before making an offer.")

        status_changed = application.status != new_status
        application.status = new_status
        if status_changed:
            audit_service.enqueue(
                db,
                action="candidate_application_status_updated",
                module="company",
                user_id=user.id,
                organization_type="company",
                organization_id=company.id,
                entity_type="application",
                entity_id=application.id,
                metadata={"status": new_status},
            )
            notification_service.enqueue(
                db,
                user_id=application.candidate_user_id,
                title="Application status updated",
                message=f"{company.name} updated your application status to {new_status.replace('_', ' ')}.",
                notification_type="application",
                related_entity_type="application",
                related_entity_id=str(application.id),
            )
        await db.commit()
        await db.refresh(application)
        return application

    async def schedule_interview(
        self,
        db: AsyncSession,
        user: User,
        application_id: int,
        payload: dict[str, Any],
    ) -> CompanyInterview:
        company = await self.get_company_for_user(db, user)
        if not company or company.status != "verified":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verified company access required.")

        result = await db.execute(
            select(CandidateApplication, JobPosting)
            .join(JobPosting, JobPosting.id == CandidateApplication.job_id)
            .where(CandidateApplication.id == application_id, JobPosting.company_id == company.id)
        )
        row = result.one_or_none()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found for this company.")
        application, job = row
        if application.status not in {"shortlisted", "interview"}:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only shortlisted candidates can be scheduled for an interview.")

        privacy_result = await db.execute(
            select(CandidatePrivacySettings).where(CandidatePrivacySettings.user_id == application.candidate_user_id)
        )
        privacy = privacy_result.scalar_one_or_none()
        if not application.consent_to_recruiters or not privacy or not privacy.share_contact_info:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Current candidate consent and shared contact information are required.")

        scheduled_at = payload["scheduled_at"]
        if scheduled_at.tzinfo is not None:
            scheduled_at = scheduled_at.astimezone(timezone.utc).replace(tzinfo=None)
        if scheduled_at <= datetime.utcnow():
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Interview time must be in the future.")

        interview_result = await db.execute(
            select(CompanyInterview).where(CompanyInterview.application_id == application.id)
        )
        interview = interview_result.scalar_one_or_none()
        if interview is not None and interview.status != "scheduled":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A completed interview cannot be rescheduled.")
        if interview is None:
            interview = CompanyInterview(application_id=application.id)
            db.add(interview)
        interview.scheduled_at = scheduled_at
        interview.duration_minutes = payload["duration_minutes"]
        interview.meeting_url = payload.get("meeting_url", "").strip()
        interview.notes = payload.get("notes", "").strip()
        interview.status = "scheduled"
        interview.created_by_user_id = user.id
        application.status = "interview"

        audit_service.enqueue(
            db,
            action="candidate_interview_scheduled",
            module="company",
            user_id=user.id,
            organization_type="company",
            organization_id=company.id,
            entity_type="application",
            entity_id=application.id,
            metadata={"job_id": job.id, "scheduled_at": scheduled_at.isoformat()},
        )
        notification_service.enqueue(
            db,
            user_id=application.candidate_user_id,
            title="Interview scheduled",
            message=f"{company.name} scheduled an interview for {job.title}.",
            notification_type="application",
            related_entity_type="application",
            related_entity_id=str(application.id),
        )
        await db.commit()
        await db.refresh(interview)
        return interview

    async def list_company_interviews(self, db: AsyncSession, user: User) -> list[dict[str, Any]]:
        company = await self.get_company_for_user(db, user)
        if not company:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Company access required.")
        result = await db.execute(
            select(CompanyInterview, CandidateApplication, User, JobPosting, CandidatePrivacySettings)
            .join(CandidateApplication, CandidateApplication.id == CompanyInterview.application_id)
            .join(User, User.id == CandidateApplication.candidate_user_id)
            .join(JobPosting, JobPosting.id == CandidateApplication.job_id)
            .outerjoin(CandidatePrivacySettings, CandidatePrivacySettings.user_id == User.id)
            .where(JobPosting.company_id == company.id, CompanyInterview.status.in_(("scheduled", "completed")))
            .order_by(CompanyInterview.scheduled_at.asc())
        )
        return [
            {
                "id": interview.id,
                "application_id": application.id,
                "job_id": job.id,
                "job_title": job.title,
                "candidate_name": candidate.full_name if application.consent_to_recruiters and privacy and privacy.share_contact_info else "Private candidate",
                "candidate_email": candidate.email if application.consent_to_recruiters and privacy and privacy.share_contact_info else "",
                "scheduled_at": interview.scheduled_at.replace(tzinfo=timezone.utc).isoformat(),
                "duration_minutes": interview.duration_minutes,
                "meeting_url": interview.meeting_url,
                "notes": interview.notes,
                "status": interview.status,
            }
            for interview, application, candidate, job, privacy in result.all()
        ]

    async def complete_interview(self, db: AsyncSession, user: User, interview_id: int) -> CompanyInterview:
        company = await self.get_company_for_user(db, user)
        if not company or company.status != "verified":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verified company access required.")
        result = await db.execute(
            select(CompanyInterview, CandidateApplication, JobPosting)
            .join(CandidateApplication, CandidateApplication.id == CompanyInterview.application_id)
            .join(JobPosting, JobPosting.id == CandidateApplication.job_id)
            .where(CompanyInterview.id == interview_id, JobPosting.company_id == company.id)
        )
        row = result.one_or_none()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found for this company.")
        interview, application, job = row
        if interview.status != "scheduled":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only scheduled interviews can be completed.")

        interview.status = "completed"
        audit_service.enqueue(
            db,
            action="candidate_interview_completed",
            module="company",
            user_id=user.id,
            organization_type="company",
            organization_id=company.id,
            entity_type="application",
            entity_id=application.id,
            metadata={"job_id": job.id, "interview_id": interview.id},
        )
        notification_service.enqueue(
            db,
            user_id=application.candidate_user_id,
            title="Interview completed",
            message=f"Your interview for {job.title} has been marked complete.",
            notification_type="application",
            related_entity_type="application",
            related_entity_id=str(application.id),
        )
        await db.commit()
        await db.refresh(interview)
        return interview

    async def list_jobs(self, db: AsyncSession, user: User) -> list[JobPosting]:
        company = await self.get_company_for_user(db, user)
        if not company:
            return []
        stmt = select(JobPosting).where(JobPosting.company_id == company.id).order_by(JobPosting.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_job_assessment_config_id(
        self,
        db: AsyncSession,
        user: User,
        job_id: int,
    ) -> str | None:
        company = await self.get_company_for_user(db, user)
        if not company:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Company access required.")
        job_result = await db.execute(
            select(JobPosting.id).where(JobPosting.id == job_id, JobPosting.company_id == company.id)
        )
        if job_result.scalar_one_or_none() is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found for this company.")
        config_result = await db.execute(select(BattleConfig.id).where(BattleConfig.job_id == job_id))
        return config_result.scalar_one_or_none()

    async def list_candidates(self, db: AsyncSession, user: User, job_id: int | None = None) -> list[dict[str, Any]]:
        company = await self.get_company_for_user(db, user)
        if not company:
            return []

        stmt = (
            select(CandidateApplication, User, Profile, JobPosting, CandidatePrivacySettings, CompanyInterview)
            .join(JobPosting, JobPosting.id == CandidateApplication.job_id)
            .join(User, User.id == CandidateApplication.candidate_user_id)
            .outerjoin(Profile, Profile.user_id == User.id)
            .outerjoin(CandidatePrivacySettings, CandidatePrivacySettings.user_id == User.id)
            .outerjoin(CompanyInterview, CompanyInterview.application_id == CandidateApplication.id)
            .where(JobPosting.company_id == company.id)
        )
        if job_id is not None:
            stmt = stmt.where(JobPosting.id == job_id)
        stmt = stmt.order_by(CandidateApplication.created_at.desc())
        result = await db.execute(stmt)

        rows: list[dict[str, Any]] = []
        for application, candidate, profile, posting, privacy, interview in result.all():
            consented = application.consent_to_recruiters
            share_contact = consented and bool(privacy and privacy.share_contact_info)
            share_skills = consented and bool(privacy and privacy.share_skill_profile)
            share_results = consented and bool(privacy and privacy.share_assessment_results)
            skill_profile = await skill_profile_service.get_profile(db, candidate) if share_skills else None
            required_skills = [
                item.strip().casefold()
                for item in posting.required_skills.replace(";", ",").split(",")
                if item.strip()
            ]
            skill_rows = skill_profile["skills"] if skill_profile else []
            eligible = not required_skills or all(
                any(
                    skill["skill"].casefold() == required
                    and skill["score"] >= 60
                    and skill["attempts"] > 0
                    for skill in skill_rows
                )
                for required in required_skills
            )
            rows.append(
                {
                    "application_id": application.id,
                    "job_id": posting.id,
                    "job_title": posting.title,
                    "candidate_id": candidate.id if share_contact else None,
                    "candidate_name": candidate.full_name if share_contact else "Private candidate",
                    "candidate_email": candidate.email if share_contact else "",
                    "status": application.status,
                    "score": application.score,
                    "consent": consented,
                    "eligible": eligible if share_skills else False,
                    "skill_profile": skill_profile if share_skills else None,
                    "assessment_status": application.assessment_status,
                    "assessment_score": application.assessment_score if share_results else None,
                    "interview_status": interview.status if interview else None,
                    "target_company": (profile.target_company if share_contact and profile else ""),
                    "github": (profile.github if share_contact and profile else ""),
                    "linkedin": (profile.linkedin if share_contact and profile else ""),
                }
            )
        return rows

    async def discover_candidates(self, db: AsyncSession, user: User, job_id: int) -> list[dict[str, Any]]:
        company = await self.get_company_for_user(db, user)
        if not company or company.status != "verified":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verified company access required.")

        job_result = await db.execute(
            select(JobPosting).where(JobPosting.id == job_id, JobPosting.company_id == company.id)
        )
        job = job_result.scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found for this company.")

        required_skills = [
            item.strip().casefold()
            for item in job.required_skills.replace(";", ",").split(",")
            if item.strip()
        ]
        candidates_result = await db.execute(
            select(User, CandidatePrivacySettings)
            .join(CandidatePrivacySettings, CandidatePrivacySettings.user_id == User.id)
            .where(
                User.is_active.is_(True),
                User.role.in_(("user", "student")),
                CandidatePrivacySettings.allow_recruiter_search.is_(True),
                CandidatePrivacySettings.share_skill_profile.is_(True),
            )
        )

        eligible_candidates: list[dict[str, Any]] = []
        for candidate, privacy in candidates_result.all():
            profile = await skill_profile_service.get_profile(db, candidate)
            skills = profile["skills"]
            if required_skills and not all(
                any(
                    skill["skill"].casefold() == required
                    and skill["score"] >= 60
                    and skill["attempts"] > 0
                    for skill in skills
                )
                for required in required_skills
            ):
                continue

            eligible_candidates.append(
                {
                    "candidate_id": candidate.id if privacy.share_contact_info else None,
                    "candidate_name": candidate.full_name if privacy.share_contact_info else "Private candidate",
                    "candidate_email": candidate.email if privacy.share_contact_info else "",
                    "job_id": job.id,
                    "job_title": job.title,
                    "eligible": True,
                    "skill_profile": profile,
                }
            )

        return eligible_candidates

    @staticmethod
    def _parse_job_skills(raw_skills: str | None) -> list[str]:
        if not raw_skills:
            return []
        parts = [item.strip() for item in raw_skills.replace(";", ",").split(",")]
        return [item for item in parts if item]

    @staticmethod
    def _normalize_skill_label(skill_name: str | None) -> str:
        normalized = (skill_name or "").strip()
        if not normalized:
            return "general"
        return normalize_skill_id(normalized)

    async def _candidate_signal_summary(self, db: AsyncSession, candidate_user_id: str) -> dict[str, Any]:
        result = await db.execute(
            select(SkillEvidence).where(SkillEvidence.user_id == candidate_user_id).order_by(SkillEvidence.timestamp.desc())
        )
        rows = result.scalars().all()
        by_skill: dict[str, list[SkillEvidence]] = defaultdict(list)
        for row in rows:
            by_skill[row.skill_id].append(row)

        skills = []
        for skill_id, evidence_rows in sorted(by_skill.items()):
            avg_score = round(sum(item.score for item in evidence_rows) / len(evidence_rows), 1)
            accuracy = round(sum(1 for item in evidence_rows if item.correct) / len(evidence_rows) * 100.0, 1)
            skills.append(
                {
                    "skill_id": skill_id,
                    "skill_name": evidence_rows[0].skill_name,
                    "score": avg_score,
                    "accuracy": accuracy,
                    "evidence_count": len(evidence_rows),
                }
            )
        return {
            "skills": sorted(skills, key=lambda item: (-item["score"], item["skill_name"])),
            "evidence_count": len(rows),
            "strongest_skill": max(skills, key=lambda item: item["score"], default={"skill_name": "general"}),
        }

    async def get_company_command_center(self, db: AsyncSession, user: User) -> dict[str, Any]:
        company = await self.get_company_for_user(db, user)
        if not company:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Company access required.")
        if company.status != "verified":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Company verification is required to access the hiring command center.",
            )

        jobs = await self.list_jobs(db, user)
        candidate_rows = await self.list_candidates(db, user)

        active_jobs = [job for job in jobs if job.status in {"open", "active"}]
        pipeline_counts: dict[str, int] = defaultdict(int)
        funnel_counts: dict[str, int] = defaultdict(int)
        skill_demand: dict[str, int] = defaultdict(int)
        for job in jobs:
            for skill_name in self._parse_job_skills(job.required_skills):
                skill_demand[self._normalize_skill_label(skill_name)] += 1
        for row in candidate_rows:
            status_name = str(row.get("status") or "applied").lower()
            pipeline_counts[status_name] += 1
            if status_name in {"applied", "under_review", "assessment", "shortlisted", "interview", "offer", "hired", "rejected"}:
                funnel_counts[status_name] += 1

        priority_reviews = []
        for row in sorted(candidate_rows, key=lambda item: item.get("score") or 0, reverse=True)[:5]:
            if row["status"] in {"applied", "under_review", "assessment"}:
                priority_reviews.append(
                    {
                        "candidate_name": row["candidate_name"],
                        "job_title": row["job_title"],
                        "status": row["status"],
                        "reason": "Needs recruiter review before the next stage.",
                    }
                )

        active_assessments = []
        for job in active_jobs:
            battle_config = await db.execute(select(BattleConfig).where(BattleConfig.job_id == job.id))
            config = battle_config.scalar_one_or_none()
            if config:
                active_assessments.append(
                    {
                        "job_id": job.id,
                        "job_title": job.title,
                        "assessment_title": config.title,
                        "difficulty": config.difficulty,
                        "status": "active",
                    }
                )

        review_needed = sum(1 for row in candidate_rows if row["status"] in {"applied", "under_review", "assessment"})
        decisions_waiting = sum(1 for row in candidate_rows if row["status"] in {"shortlisted", "interview"})
        return {
            "company_id": company.id,
            "company_name": company.name,
            "active_jobs": [
                {
                    "id": job.id,
                    "title": job.title,
                    "location": job.location,
                    "status": job.status,
                    "employment_type": job.employment_type,
                    "required_skills": job.required_skills,
                }
                for job in active_jobs[:6]
            ],
            "candidate_pipeline": [
                {"stage": stage, "count": count}
                for stage, count in sorted(pipeline_counts.items(), key=lambda item: item[0])
            ],
            "hiring_funnel": [
                {"stage": stage, "count": count}
                for stage, count in sorted(funnel_counts.items(), key=lambda item: item[0])
            ],
            "skill_demand": [
                {"skill": skill.split(".")[-1].replace("-", " ").title(), "count": count}
                for skill, count in sorted(skill_demand.items(), key=lambda item: (-item[1], item[0]))[:8]
            ],
            "priority_reviews": priority_reviews,
            "active_assessments": active_assessments,
            "work_queue": {
                "review_candidates": review_needed,
                "pending_assessments": len(active_assessments),
                "interviews_today": 0,
                "decisions_waiting": decisions_waiting,
            },
            "generated_at": datetime.utcnow().isoformat(),
        }

    async def get_candidate_match(self, db: AsyncSession, user: User, candidate_user_id: str, job_id: int) -> dict[str, Any]:
        company = await self.get_company_for_user(db, user)
        if not company:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Company access required.")

        job = await db.get(JobPosting, job_id)
        if not job or job.company_id != company.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found for this company.")

        candidate = await db.get(User, candidate_user_id)
        if not candidate:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found.")

        privacy_result = await db.execute(
            select(CandidatePrivacySettings).where(CandidatePrivacySettings.user_id == candidate_user_id)
        )
        privacy = privacy_result.scalar_one_or_none()
        if privacy is None or not privacy.allow_recruiter_search or not privacy.share_skill_profile:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Candidate profile is not discoverable for this job.")

        required_skills = self._parse_job_skills(job.required_skills)
        candidate_signals = await self._candidate_signal_summary(db, candidate_user_id)
        candidate_skill_map = {item["skill_id"]: item["score"] for item in candidate_signals["skills"]}

        matched_skills: list[str] = []
        missing_skills: list[str] = []
        for raw_skill in required_skills:
            normalized = self._normalize_skill_label(raw_skill)
            if not normalized or normalized == "general":
                continue
            if any(skill_id == normalized or skill_id.startswith(f"{normalized}.") for skill_id in candidate_skill_map):
                matched_skills.append(raw_skill)
            else:
                missing_skills.append(raw_skill)

        total_required = max(len(required_skills), 1)
        match_ratio = len(matched_skills) / total_required
        if not candidate_signals["skills"]:
            confidence = "LOW"
            match_status = "NOT_ASSESSED"
            readiness = "NOT_ASSESSED"
            explanation = "Insufficient evidence is available for this candidate for this role."
        elif match_ratio >= 0.8:
            confidence = "HIGH"
            match_status = "STRONG_MATCH"
            readiness = "MEETS_REQUIREMENT"
            explanation = (
                f"Strong match because the candidate meets {len(matched_skills)} of {total_required} required skills "
                "and has verified evidence from platform assessments and skill records."
            )
        elif match_ratio >= 0.5:
            confidence = "MEDIUM"
            match_status = "PARTIAL_MATCH"
            readiness = "BELOW_REQUIREMENT"
            explanation = (
                f"Reasonable fit because the candidate matches {len(matched_skills)} required skills, but needs additional evidence in "
                f"{', '.join(missing_skills[:3]) if missing_skills else 'the remaining role requirements'}."
            )
        else:
            confidence = "LOW"
            match_status = "WEAK_MATCH"
            readiness = "NOT_ASSESSED" if not candidate_signals["skills"] else "BELOW_REQUIREMENT"
            explanation = (
                f"The candidate is below the current role requirement because {len(missing_skills)} required skills remain unproven."
            )

        return {
            "candidate_id": candidate.id,
            "candidate_name": candidate.full_name,
            "job_id": job.id,
            "job_title": job.title,
            "match_status": match_status,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "assessment_fit": round(match_ratio * 100, 1),
            "readiness": readiness,
            "confidence": confidence,
            "explanation": explanation,
            "evidence": candidate_signals,
        }

    async def list_pending_companies(self, db: AsyncSession) -> list[Company]:
        result = await db.execute(select(Company).where(Company.status == "pending").order_by(Company.created_at.asc()))
        return list(result.scalars().all())

    async def update_company_status(self, db: AsyncSession, company_id: int, company_status: str) -> Company:
        company = await db.get(Company, company_id)
        if not company:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found.")
        company.status = company_status
        owner = await db.get(User, company.created_by_user_id) if company.created_by_user_id else None
        if owner:
            owner.account_type = "COMPANY"
            if company_status == "verified":
                owner.role = "company_admin"
                owner.requested_role = None
                owner.status = "ACTIVE"
                owner.is_active = True
            elif company_status == "rejected":
                owner.role = "student"
                owner.status = "REJECTED"
            elif company_status == "suspended":
                owner.status = "SUSPENDED"
        await db.commit()
        await db.refresh(company)
        return company

    async def get_dashboard(self, db: AsyncSession, user: User) -> dict[str, Any]:
        company = await self.get_company_for_user(db, user)
        if not company:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Company access required.")
        if company.status != "verified":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Company verification is required to access the hiring dashboard.",
            )

        jobs = await self.list_jobs(db, user)
        candidate_rows = await self.list_candidates(db, user)
        shortlisted_total = sum(1 for item in candidate_rows if item["status"] == "shortlisted")
        pipeline: dict[str, int] = {}
        job_metrics: dict[int, dict[str, Any]] = {
            job.id: {"job_id": job.id, "title": job.title, "applications": 0, "shortlisted": 0}
            for job in jobs
        }
        skill_counts: dict[str, int] = {}
        assessment_completed = 0
        for item in candidate_rows:
            status_value = str(item.get("status") or "applied")
            pipeline[status_value] = pipeline.get(status_value, 0) + 1
            if item.get("assessment_status") == "completed":
                assessment_completed += 1
            job_metric = job_metrics.get(item["job_id"])
            if job_metric:
                job_metric["applications"] += 1
                if status_value == "shortlisted":
                    job_metric["shortlisted"] += 1
            profile = item.get("skill_profile")
            if profile:
                for skill in profile.get("skills", []):
                    skill_name = str(skill.get("skill") or "").strip()
                    if skill_name:
                        skill_counts[skill_name] = skill_counts.get(skill_name, 0) + 1

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
            "active_jobs": sum(1 for job in jobs if job.status in {"open", "active"}),
            "candidates_total": len(candidate_rows),
            "shortlisted_total": shortlisted_total,
            "assessment_completed": assessment_completed,
            "application_pipeline": [
                {"status": status_name, "count": count}
                for status_name, count in sorted(pipeline.items())
            ],
            "candidate_skill_distribution": [
                {"skill": skill, "count": count}
                for skill, count in sorted(skill_counts.items(), key=lambda entry: (-entry[1], entry[0]))
            ],
            "job_performance": list(job_metrics.values()),
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
        if job.status not in {"open", "active"}:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This job is not accepting applications.")
        company_result = await db.execute(select(Company).where(Company.id == job.company_id))
        company = company_result.scalar_one_or_none()
        if not company or company.status != "verified":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Company is not verified.")

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
        await db.flush()

        members_result = await db.execute(
            select(CompanyMember.user_id).where(
                CompanyMember.company_id == company.id,
                CompanyMember.status == "active",
            )
        )
        for member_user_id in set(members_result.scalars().all()):
            if member_user_id == user.id:
                continue
            notification_service.enqueue(
                db,
                user_id=member_user_id,
                title=f"New application: {job.title}",
                message="A candidate applied for this role.",
                notification_type="application",
                related_entity_type="application",
                related_entity_id=str(application.id),
            )

        audit_service.enqueue(
            db,
            action="candidate_application_submitted",
            module="company",
            user_id=user.id,
            organization_type="company",
            organization_id=company.id,
            entity_type="application",
            entity_id=application.id,
            metadata={"job_id": job.id},
        )

        await db.commit()
        await db.refresh(application)
        return application


company_service = CompanyService()
