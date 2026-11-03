import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.database import session as database_session
from app.models.user import User


class FailingCommitSession:
    is_active = True
    dirty = ()
    new = ()
    deleted = ()

    def __init__(self):
        self.rollback_called = False
        self.commit_called = False
        self.sync_session = type("SyncSession", (), {"info": {
            database_session._REQUEST_HAS_WRITES: True,
        }})()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_value, traceback):
        return False

    async def commit(self):
        self.commit_called = True
        raise RuntimeError("commit failed")

    def in_transaction(self):
        return True

    async def rollback(self):
        self.rollback_called = True

    async def close(self):
        return None


@pytest.mark.asyncio
async def test_get_db_propagates_commit_failure(monkeypatch):
    session = FailingCommitSession()
    monkeypatch.setattr(database_session, "AsyncSessionLocal", lambda: session)
    dependency = database_session.get_db()

    assert await anext(dependency) is session
    with pytest.raises(RuntimeError, match="commit failed"):
        await anext(dependency)

    assert session.commit_called
    assert session.rollback_called


@pytest.mark.asyncio
async def test_get_db_commits_writes_after_they_were_flushed(monkeypatch):
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(User.__table__.create)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    monkeypatch.setattr(database_session, "AsyncSessionLocal", session_factory)

    dependency = database_session.get_db()
    request_session = await anext(dependency)
    user = User(
        username="flushed_user",
        full_name="Flushed User",
        email="flushed@example.com",
        password_hash="test-password",
    )
    request_session.add(user)
    await request_session.flush()

    with pytest.raises(StopAsyncIteration):
        await anext(dependency)

    async with session_factory() as verify_session:
        persisted_user = await verify_session.get(User, user.id)
        assert persisted_user is not None
        assert persisted_user.email == user.email

    await engine.dispose()
