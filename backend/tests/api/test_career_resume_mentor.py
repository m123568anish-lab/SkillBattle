from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.api.v1.mentor import mentor_service
from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.main import app
from app.modules.career.services.upload_service import upload_service


@pytest.mark.asyncio
async def test_upload_service_returns_top_level_success_payload():
    db = object()
    user = SimpleNamespace(id="user-123")
    file = SimpleNamespace(filename="resume.pdf")

    with (
        patch("app.modules.career.services.upload_service.file_storage.save", AsyncMock(return_value={
            "original_filename": "resume.pdf",
            "stored_filename": "resume-123.pdf",
            "file_path": "/tmp/resume-123.pdf",
            "file_size": 256,
            "content_type": "application/pdf",
            "checksum": "abc123",
        })),
        patch("app.modules.career.services.upload_service.resume_repository.create", AsyncMock(return_value=SimpleNamespace(
            id="resume-123",
            created_at="2026-10-01T00:00:00Z",
            original_filename="resume.pdf",
            mime_type="application/pdf",
            file_size=256,
            user_id="user-123",
        ))),
        patch("app.modules.career.services.upload_service.pipeline_service.process_resume", AsyncMock(return_value={"status": "ok"})),
    ):
        result = await upload_service.upload_resume(db=db, user=user, file=file)

    assert result["success"] is True
    assert result["resume_id"] == "resume-123"
    assert result["metadata"]["filename"] == "resume.pdf"
    assert result["analysis"]["status"] == "ok"


@pytest.mark.asyncio
async def test_mentor_uses_resume_context_when_answering(client):
    previous_overrides = app.dependency_overrides.copy()
    user = SimpleNamespace(id="user-456")
    resume = SimpleNamespace(
        id="resume-456",
        user_id="user-456",
        full_name="Ada Lovelace",
        email="ada@example.com",
        title="Software Engineer",
        skills=["Python", "FastAPI", "SQL"],
        experience=[{"title": "Backend Engineer"}],
        projects=[{"name": "SkillBattle", "description": "Built an AI learning platform"}],
        education=[{"school": "London University"}],
        certifications=["AWS"],
        github="https://github.com/ada",
        linkedin="https://linkedin.com/in/ada",
        ai_summary="Strong backend developer",
    )

    async def fake_execute(_stmt):
        return SimpleNamespace(scalar_one_or_none=lambda: resume)

    async def override_get_db():
        return SimpleNamespace(execute=fake_execute)

    async def override_get_current_user():
        return user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        with patch("app.api.v1.mentor.mentor_service.ask", return_value="Use a stronger project story.") as mock_ask:
            response = await client.post(
                "/api/v1/career/mentor",
                json={"resume_id": "resume-456", "question": "How should I improve my resume?"},
            )

        assert response.status_code == 200
        assert response.json()["answer"] == "Use a stronger project story."
        context = mock_ask.call_args.kwargs["resume_context"]
        assert "Ada Lovelace" in context
        assert "Python" in context
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous_overrides)
