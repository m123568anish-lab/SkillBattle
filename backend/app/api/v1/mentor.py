from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.resume import Resume
from app.models.user import User
from app.schemas.mentor import (
    MentorRequest,
    MentorResponse,
)

from app.services.mentor_service import (
    mentor_service,
)

router = APIRouter(
    prefix="/career/mentor",
    tags=["AI Mentor"],
)


def _build_resume_context(resume: Resume | None) -> str:
    if resume is None:
        return ""

    full_name = getattr(resume, "full_name", None) or "Unknown"
    title = getattr(resume, "title", None) or "Professional"
    email = getattr(resume, "email", None) or "Not provided"
    location = getattr(resume, "location", None) or "Not provided"
    linkedin = getattr(resume, "linkedin", None) or "Not provided"
    github = getattr(resume, "github", None) or "Not provided"
    portfolio = getattr(resume, "portfolio", None) or "Not provided"
    summary = getattr(resume, "ai_summary", None) or "No summary provided"

    sections: list[str] = [
        f"Name: {full_name}",
        f"Title: {title}",
        f"Email: {email}",
        f"Location: {location}",
        f"LinkedIn: {linkedin}",
        f"GitHub: {github}",
        f"Portfolio: {portfolio}",
        f"Summary: {summary}",
    ]

    skills = getattr(resume, "skills", None) or []
    if skills:
        sections.append(f"Skills: {', '.join(str(skill) for skill in skills)}")

    projects = getattr(resume, "projects", None) or []
    if projects:
        project_lines = [
            f"- {project.get('name', 'Project')}: {project.get('description', '')}"
            if isinstance(project, dict)
            else f"- {project}"
            for project in projects[:4]
        ]
        sections.append("Projects:\n" + "\n".join(project_lines))

    experience = getattr(resume, "experience", None) or []
    if experience:
        experience_lines = [
            f"- {item.get('role', item.get('title', 'Role'))}: {item.get('company', 'Company')}"
            if isinstance(item, dict)
            else f"- {item}"
            for item in experience[:3]
        ]
        sections.append("Experience:\n" + "\n".join(experience_lines))

    return "\n".join(sections)


@router.post(
    "",
    response_model=MentorResponse,
)
async def ask_ai(
    request: MentorRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    try:
        resume_context = ""
        if request.resume_id:
            result = await db.execute(
                select(Resume).where(
                    Resume.id == request.resume_id,
                    Resume.user_id == current_user.id,
                )
            )
            resume = result.scalar_one_or_none()
            resume_context = _build_resume_context(resume)

        if not resume_context:
            fallback = await db.execute(
                select(Resume)
                .where(Resume.user_id == current_user.id, Resume.active.is_(True))
                .order_by(Resume.created_at.desc())
            )
            active_resume = fallback.scalar_one_or_none()
            resume_context = _build_resume_context(active_resume)

        answer = mentor_service.ask(
            question=request.question,
            resume_context=resume_context,
        )

        return MentorResponse(
            answer=answer,
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )