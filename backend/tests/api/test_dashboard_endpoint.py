import pytest
from uuid import uuid4

@pytest.mark.asyncio
async def test_dashboard_endpoint_success_and_latency(client):
    unique_id = uuid4().hex[:8]
    email = f"dash_{unique_id}@example.com"
    password = "StrongPass#123"

    reg = await client.post("/auth/register", json={
        "username": f"dash_{unique_id}",
        "email": email,
        "full_name": "Dashboard Tester",
        "password": password,
    })
    assert reg.status_code == 201

    login = await client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200
    token = login.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    import time
    start = time.perf_counter()
    resp = await client.get("/dashboard", headers=headers)
    elapsed = time.perf_counter() - start

    assert resp.status_code == 200, f"Dashboard returned {resp.status_code}: {resp.text}"
    data = resp.json()
    assert "user" in data
    assert "stats" in data
    assert "command_center" in data
    print(f"\n[BENCHMARK] /dashboard response time: {elapsed*1000:.2f}ms")


@pytest.mark.asyncio
async def test_dashboard_with_active_roadmap(client):
    from app.models.roadmap import Roadmap, RoadmapWeek, RoadmapTask
    from app.database.session import AsyncSessionLocal

    unique_id = uuid4().hex[:8]
    email = f"dash_rm_{unique_id}@example.com"
    password = "StrongPass#123"

    reg = await client.post("/auth/register", json={
        "username": f"dash_rm_{unique_id}",
        "email": email,
        "full_name": "Roadmap Dashboard User",
        "password": password,
    })
    assert reg.status_code == 201
    user_id = reg.json()["id"]

    login = await client.post("/auth/login", json={"email": email, "password": password})
    token = login.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Insert an active roadmap with multiple weeks and tasks
    async with AsyncSessionLocal() as db:
        rm = Roadmap(
            user_id=user_id,
            title="Fullstack Mastery",
            target_company="Google",
            duration_weeks=4,
            estimated_hours=40,
            progress=25,
            status="ACTIVE",
        )
        db.add(rm)
        await db.flush()

        w1 = RoadmapWeek(roadmap_id=rm.id, week_number=1, title="Week 1: Fundamentals", objective="Learn DSA", completion=100)
        w2 = RoadmapWeek(roadmap_id=rm.id, week_number=2, title="Week 2: Advanced", objective="Learn Trees", completion=0)
        db.add_all([w1, w2])
        await db.flush()

        t1 = RoadmapTask(week_id=w1.id, day=1, topic="Arrays", difficulty="Easy", estimated_minutes=30, reward_xp=50, completed=True)
        t2 = RoadmapTask(week_id=w1.id, day=2, topic="Strings", difficulty="Easy", estimated_minutes=30, reward_xp=50, completed=True)
        t3 = RoadmapTask(week_id=w2.id, day=1, topic="Trees", difficulty="Medium", estimated_minutes=60, reward_xp=100, completed=False)
        db.add_all([t1, t2, t3])
        await db.commit()

    import time
    start = time.perf_counter()
    resp = await client.get("/dashboard", headers=headers)
    elapsed = time.perf_counter() - start

    assert resp.status_code == 200, f"Dashboard failed with active roadmap: {resp.status_code} {resp.text}"
    data = resp.json()
    assert data["command_center"]["roadmap"]["title"] == "Fullstack Mastery"
    print(f"\n[BENCHMARK] /dashboard with roadmap: {elapsed*1000:.2f}ms")

