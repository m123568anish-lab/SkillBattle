from fastapi import APIRouter, HTTPException

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


def _build_resume_context(resume: object | None) -> str:
    if resume is None:
        return ""

    sections: list[str] = [
        f"Name: {getattr(resume, 'full_name', None) or 'Unknown'}",
        f"Title: {getattr(resume, 'title', None) or 'Professional'}",
        f"Email: {getattr(resume, 'email', None) or 'Not provided'}",
        f"Location: {getattr(resume, 'location', None) or 'Not provided'}",
        f"LinkedIn: {getattr(resume, 'linkedin', None) or 'Not provided'}",
        f"GitHub: {getattr(resume, 'github', None) or 'Not provided'}",
        f"Portfolio: {getattr(resume, 'portfolio', None) or 'Not provided'}",
        f"Summary: {getattr(resume, 'ai_summary', None) or 'No summary provided'}",
    ]

    skills = getattr(resume, 'skills', None) or []
    if skills:
        sections.append(f"Skills: {', '.join(str(skill) for skill in skills)}")

    projects = getattr(resume, 'projects', None) or []
    if projects:
        project_lines = [
            f"- {project.get('name', 'Project')}: {project.get('description', '')}"
            if isinstance(project, dict)
            else f"- {project}"
            for project in projects[:4]
        ]
        sections.append("Projects:\n" + "\n".join(project_lines))

    experience = getattr(resume, 'experience', None) or []
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
):

    try:
        resume_context = _build_resume_context(None)

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