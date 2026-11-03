"""
=========================================================
SkillBattle - Resume ATS Checker & Project Audit Engine
=========================================================
"""

import re
from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.resume import Resume

router = APIRouter(prefix="/resume", tags=["Career Resume"])


# --- Schemas ---

class ResumeSaveRequest(BaseModel):
    title: str = Field(default="My Software Engineer Resume")
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    portfolio: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    education: List[dict] = Field(default_factory=list)
    experience: List[dict] = Field(default_factory=list)
    projects: List[dict] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)


class ResumeResponse(BaseModel):
    id: str
    user_id: str
    title: str
    full_name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    location: Optional[str]
    linkedin: Optional[str]
    github: Optional[str]
    portfolio: Optional[str]
    skills: List[Any]
    education: List[Any]
    experience: List[Any]
    projects: List[Any]
    certifications: List[Any]
    ats_score: int
    placement_score: int
    ai_summary: Optional[str]

    class Config:
        from_attributes = True


class ProjectIssueItem(BaseModel):
    project_name: str
    issue_type: str
    problem_found: str
    recommendation: str
    suggested_rewrite: str


class ATSAnalysisResponse(BaseModel):
    ats_score: int
    placement_readiness_score: int
    summary_verdict: str
    skills_health: Dict[str, Any]
    project_issues: List[ProjectIssueItem]
    actionable_recommendations: List[str]


# --- Project Audit Engine ---
STRONG_VERBS = ["engineered", "developed", "architected", "built", "implemented", "optimized", "scaled", "designed", "created", "spearheaded", "reduced", "increased"]
METRIC_PATTERNS = [r'\d+%', r'\d+\s*ms', r'\d+\s*k', r'\d+\s*m', r'\$\d+', r'\d+\s*users', r'\d+\s*qps', r'\d+\s*x']

def audit_projects_and_ats(resume: ResumeSaveRequest) -> ATSAnalysisResponse:
    skills = [s.strip().lower() for s in resume.skills if s.strip()]
    projects = resume.projects or []
    
    # 1. Calculate ATS Score
    base_ats = 40
    if len(skills) >= 5: base_ats += 20
    elif len(skills) >= 2: base_ats += 10

    if len(projects) >= 2: base_ats += 20
    elif len(projects) == 1: base_ats += 10

    if resume.github or resume.linkedin: base_ats += 10
    if len(resume.education) > 0: base_ats += 10

    ats_score = min(100, base_ats)
    placement_score = min(
        100,
        40
        + min(len(skills), 10) * 3
        + min(len(projects), 4) * 5
        + (10 if resume.github or resume.linkedin else 0)
        + (10 if resume.education else 0),
    )

    # 2. Audit Projects for Weaknesses
    project_issues: List[ProjectIssueItem] = []
    
    if not projects:
        project_issues.append(ProjectIssueItem(
            project_name="General Project Section",
            issue_type="Missing Projects",
            problem_found="No software projects listed in resume.",
            recommendation="Add projects you have built and can explain, including your contribution and verifiable outcomes.",
            suggested_rewrite="Describe a project you actually completed, your specific contribution, and any results you can verify."
        ))
    else:
        for idx, p in enumerate(projects):
            p_name = p.get("name") or f"Project #{idx+1}"
            p_desc = p.get("description") or ""
            p_desc_lower = p_desc.lower()
            p_tech = p.get("tech_stack") or []

            # Check 1: Missing Quantitative Metrics
            has_metric = any(re.search(pat, p_desc_lower) for pat in METRIC_PATTERNS)
            if not has_metric:
                project_issues.append(ProjectIssueItem(
                    project_name=p_name,
                    issue_type="Missing Metrics",
                    problem_found="Project description does not include measurable outcomes; include measurements only when verifiable.",
                    recommendation="Include measured impact only when you have evidence for it; do not invent metrics.",
                    suggested_rewrite=f"Add a measured, verifiable outcome for {p_name}, if one is available."
                ))

            # Check 2: Action Verbs
            has_strong_verb = any(verb in p_desc_lower for verb in STRONG_VERBS)
            if not has_strong_verb:
                project_issues.append(ProjectIssueItem(
                    project_name=p_name,
                    issue_type="Weak Action Verbs",
                    problem_found="Project bullet point starts with weak or passive phrases.",
                    recommendation="Start bullet points with strong action verbs (e.g. Architected, Engineered, Optimized).",
                    suggested_rewrite=f"Start with an accurate action verb describing your contribution to {p_name}."
                ))

            # Check 3: Missing Tech Stack
            if not p_tech and not any(s in p_desc_lower for s in ["python", "react", "fastapi", "java", "c++", "sql", "docker"]):
                project_issues.append(ProjectIssueItem(
                    project_name=p_name,
                    issue_type="Missing Tech Stack",
                    problem_found="Tech stack tools and frameworks are not explicitly mentioned.",
                    recommendation="Explicitly list frameworks, databases, and protocols used (e.g., Python, PostgreSQL, Redis, React).",
                    suggested_rewrite="List only the languages, frameworks, and tools you actually used."
                ))

    # 3. Actionable General Recommendations
    recommendations = []
    if len(skills) < 5:
        recommendations.append("Add more industry-standard technical skills (e.g., Data Structures, System Design, SQL, Docker, FastAPI).")
    if not resume.github:
        recommendations.append("Include your GitHub profile URL to let recruiters review your source code.")
    if not resume.linkedin:
        recommendations.append("Include your LinkedIn profile link to improve ATS social proof matching.")
    if not any("sql" in s or "database" in s for s in skills):
        recommendations.append("If you have relevant SQL or database experience, include those skills in your resume.")
    if len(recommendations) == 0:
        recommendations.append("These checks found no missing fields. Review the content for accuracy; this is not an external ATS evaluation.")

    verdict = (
        f"Rule-based resume structure estimate: {ats_score}/100. " +
        (f"Found {len(project_issues)} items to review." if project_issues else "No project issues were detected by these checks.")
    )

    return ATSAnalysisResponse(
        ats_score=ats_score,
        placement_readiness_score=placement_score,
        summary_verdict=verdict,
        skills_health={"total_skills": len(skills), "skills_list": resume.skills},
        project_issues=project_issues,
        actionable_recommendations=recommendations
    )


# --- Endpoints ---

@router.get("", response_model=Optional[ResumeResponse])
async def get_user_resume(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Resume)
        .where(Resume.user_id == current_user.id, Resume.active == True)
        .order_by(Resume.created_at.desc())
    )
    res = await db.execute(stmt)
    resume = res.scalars().first()
    return resume


@router.post("", response_model=ResumeResponse)
async def save_user_resume(
    req: ResumeSaveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Resume)
        .where(Resume.user_id == current_user.id, Resume.active == True)
    )
    res = await db.execute(stmt)
    resume = res.scalars().first()

    if not resume:
        raise HTTPException(
            status_code=409,
            detail="Upload a resume before saving resume edits.",
        )

    resume.title = req.title
    resume.full_name = req.full_name or current_user.full_name or current_user.username
    resume.email = req.email or current_user.email
    resume.phone = req.phone
    resume.location = req.location
    resume.linkedin = req.linkedin or current_user.linkedin_url
    resume.github = req.github or current_user.github_url
    resume.portfolio = req.portfolio
    resume.skills = req.skills
    resume.education = req.education
    resume.experience = req.experience
    resume.projects = req.projects
    resume.certifications = req.certifications

    analysis = audit_projects_and_ats(req)

    resume.ats_score = analysis.ats_score
    resume.placement_score = analysis.placement_readiness_score
    resume.ai_summary = analysis.summary_verdict

    await db.commit()
    await db.refresh(resume)
    return resume


@router.post("/analyze", response_model=ATSAnalysisResponse)
async def analyze_resume_and_projects(
    req: ResumeSaveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Performs rule-based structure checks and reviews project descriptions.
    Suggestions must not introduce unverified claims or metrics.
    Does NOT overwrite the user's resume!
    """
    return audit_projects_and_ats(req)
