from __future__ import annotations

from pydantic import BaseModel, Field


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


class CompanyDashboardResponse(BaseModel):
    company: CompanySummary
    jobs_total: int
    active_jobs: int
    candidates_total: int
    shortlisted_total: int
    recent_applications: list[dict]
