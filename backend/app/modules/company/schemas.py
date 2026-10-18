from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.modules.battle.schemas import BattleSectionConfig


class CompanyRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    slug: str = Field(..., min_length=2, max_length=120)
    industry: str = Field(default="")
    website: str = Field(default="")
    headquarters: str = Field(default="")
    description: str = Field(default="")


class JobPostingRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    location: str = Field(default="")
    employment_type: str = Field(default="full_time")
    remote_allowed: bool = Field(default=False)
    description: str = Field(default="")
    required_skills: str = Field(default="")
    compensation: str = Field(default="")
    status: str = Field(default="draft")
    category: str = Field(default="general", max_length=100)
    work_mode: str = Field(default="on_site", pattern="^(remote|hybrid|on_site)$")
    eligibility: str = Field(default="")
    application_url: str = Field(default="", max_length=500)
    source_url: str = Field(default="", max_length=500)
    source_label: str = Field(default="Company", max_length=120)
    opens_at: datetime | None = None
    deadline_at: datetime | None = None


class CandidateApplicationRequest(BaseModel):
    job_id: int
    consent_to_recruiters: bool = False


class ExternalApplicationRequest(BaseModel):
    job_id: int
    confirm_applied: bool = True


class CompanySummary(BaseModel):
    id: int
    name: str
    slug: str
    industry: str
    website: str
    headquarters: str
    status: str


class JobPostingResponse(BaseModel):
    id: int
    company_id: int
    title: str
    location: str
    employment_type: str
    remote_allowed: bool
    description: str
    required_skills: str
    compensation: str
    status: str
    assessment_config_id: str | None = None


class CompanyDashboardResponse(BaseModel):
    company: CompanySummary
    jobs_total: int
    active_jobs: int
    candidates_total: int
    shortlisted_total: int
    recent_applications: list[dict]
    assessment_completed: int = 0
    application_pipeline: list[dict[str, str | int]] = Field(default_factory=list)
    candidate_skill_distribution: list[dict[str, str | int]] = Field(default_factory=list)
    job_performance: list[dict[str, str | int]] = Field(default_factory=list)


class CompanyStatusRequest(BaseModel):
    status: str = Field(..., pattern="^(verified|rejected|suspended)$")


class CandidatePrivacySettingsRequest(BaseModel):
    share_contact_info: bool = False
    share_skill_profile: bool = False
    share_assessment_results: bool = False
    allow_recruiter_search: bool = False


class CandidatePrivacySettingsResponse(CandidatePrivacySettingsRequest):
    user_id: str


class CandidateApplicationConsentRequest(BaseModel):
    consent_to_recruiters: bool


class CandidateApplicationStatusRequest(BaseModel):
    status: str = Field(..., pattern="^(shortlisted|offer|hired|rejected)$")


class InterviewScheduleRequest(BaseModel):
    scheduled_at: datetime
    duration_minutes: int = Field(default=45, ge=15, le=180)
    meeting_url: str = Field(default="", max_length=500)
    notes: str = Field(default="", max_length=2000)


class CompanyAssessmentCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: str = ""
    difficulty: str = "medium"
    duration_minutes: int = Field(default=45, ge=1, le=180)
    question_count: int = Field(default=5, ge=1, le=50)
    sections: list[BattleSectionConfig]
    allowed_languages: list[str] = Field(default_factory=lambda: ["python", "javascript", "cpp", "java"])
    scoring_rules: dict = Field(default_factory=dict)
    negative_marking: bool = False


class CompanySkillRequirementCreate(BaseModel):
    skill_id: str = Field(..., max_length=120)
    importance: int = Field(default=3, ge=1, le=5)
    minimum_mastery: str = Field(default="LEARNING", max_length=30)
    recommended_mastery: str = Field(default="COMPETENT", max_length=30)


class CompanySkillRequirementResponse(BaseModel):
    id: str
    company_id: int
    skill_id: str
    importance: int
    minimum_mastery: str
    recommended_mastery: str
    created_at: datetime
