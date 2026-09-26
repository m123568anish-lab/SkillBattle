import pytest

from app.database import session as database_session
from app.main import app


class FakeSession:
    def __init__(self):
        self.commits = 0
        self.rollbacks = 0
        self.closed = False
        self.fail_on_commit = False
        self.is_active = True
        self.dirty = [1]
        self.new = []
        self.deleted = []

    async def commit(self):
        if self.fail_on_commit:
            raise RuntimeError("commit failed")
        self.commits += 1

    async def rollback(self):
        self.rollbacks += 1

    async def close(self):
        self.closed = True


class FakeSessionContext:
    def __init__(self, session):
        self.session = session

    async def __aenter__(self):
        return self.session

    async def __aexit__(self, exc_type, exc, traceback):
        return False


@pytest.mark.asyncio
async def test_get_db_commits_successful_request(monkeypatch):
    session = FakeSession()
    monkeypatch.setattr(
        database_session,
        "AsyncSessionLocal",
        lambda: FakeSessionContext(session),
    )

    dependency = database_session.get_db()
    yielded = await dependency.__anext__()
    with pytest.raises(StopAsyncIteration):
        await dependency.__anext__()

    assert yielded is session
    assert session.commits == 1
    assert session.rollbacks == 0
    assert session.closed is True


@pytest.mark.asyncio
async def test_get_db_rolls_back_failed_request(monkeypatch):
    session = FakeSession()
    monkeypatch.setattr(
        database_session,
        "AsyncSessionLocal",
        lambda: FakeSessionContext(session),
    )

    dependency = database_session.get_db()
    await dependency.__anext__()

    with pytest.raises(RuntimeError, match="request failed"):
        await dependency.athrow(RuntimeError("request failed"))

    assert session.commits == 0
    assert session.rollbacks == 1
    assert session.closed is True


@pytest.mark.asyncio
async def test_registration_does_not_return_existing_user_on_write_error(monkeypatch):
    from httpx import ASGITransport, AsyncClient
    from app.modules.auth.services.auth_service import auth_service

    async def fail_register(*args, **kwargs):
        raise ValueError("Email already registered.")

    monkeypatch.setattr(auth_service, "register", fail_register)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/auth/register",
            json={
                "username": "new_user",
                "email": "existing@example.com",
                "full_name": "Existing User",
                "password": "Password123",
            },
        )

    assert response.status_code == 409
    assert response.json()["detail"] == "Email already registered."
