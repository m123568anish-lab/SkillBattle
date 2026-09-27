from __future__ import annotations

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


class CandidateApplicationRequest(BaseModel):
    job_id: int
    consent_to_recruiters: bool = False


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
    status: str = Field(..., pattern="^(applied|shortlisted|rejected)$")


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
