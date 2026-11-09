from uuid import uuid4

import pytest

from app.database.session import AsyncSessionLocal
from app.models.challenge import Challenge
from app.models.compiler import CodeSubmission
from app.models.problem import Problem
from app.models.problem_tag import ProblemTag


async def _headers(client) -> dict[str, str]:
    key = uuid4().hex[:8]
    registration = await client.post("/auth/register", json={
        "username": f"practice_{key}", "email": f"practice_{key}@example.com",
        "full_name": "Practice User", "password": "StrongPass#123",
    })
    assert registration.status_code == 201
    login = await client.post("/auth/login", json={"email": f"practice_{key}@example.com", "password": "StrongPass#123"})
    return {"Authorization": f"Bearer {login.json()['tokens']['access_token']}"}


@pytest.mark.asyncio
async def test_practice_catalogue_and_daily_session_are_persisted(client):
    headers = await _headers(client)
    key = uuid4().hex[:8]
    async with AsyncSessionLocal() as db:
        problem = Problem(
            title=f"Daily Array Rotation {key}", slug=f"daily-arrays-{key}", difficulty="Easy", category="Arrays",
            description="Given an array and a rotation count, return the rotated array.", input_format="integer list",
            output_format="integer list", constraints="1 <= n <= 1000",
            xp_reward=100, is_active=True,
        )
        db.add(problem)
        db.add(Challenge(title=f"Arrays challenge {key}", difficulty="Easy", category="Arrays", xp_reward=50))
        await db.commit()

    catalogue = await client.get("/api/v1/practice/problems", headers=headers)
    assert catalogue.status_code == 200
    assert any(item["slug"] == f"daily-arrays-{key}" for item in catalogue.json()["items"])

    started = await client.post("/api/v1/practice/daily/start", headers=headers)
    assert started.status_code == 200
    session_id = started.json()["session"]["id"]
    assert started.json()["session"]["status"] == "IN_PROGRESS"

    repeated = await client.post("/api/v1/practice/daily/start", headers=headers)
    assert repeated.status_code == 200
    assert repeated.json()["session"]["id"] == session_id


@pytest.mark.asyncio
async def test_inactive_problem_is_not_exposed_in_public_catalogue(client):
    key = uuid4().hex[:8]
    async with AsyncSessionLocal() as db:
        inactive = Problem(
            title=f"Inactive generated problem {key}",
            slug=f"inactive-generated-{key}",
            difficulty="Easy",
            category="Arrays",
            description="Inactive content should not be exposed.",
            input_format="",
            output_format="",
            constraints="",
            is_active=False,
        )
        db.add(inactive)
        await db.commit()
        inactive_id = inactive.id

    headers = await _headers(client)
    catalogue = await client.get("/api/v1/practice/problems", headers=headers)
    assert catalogue.status_code == 200
    assert all(problem["slug"] != f"inactive-generated-{key}" for problem in catalogue.json()["items"])

    from app.modules.problem.repository import problem_repository

    async with AsyncSessionLocal() as db:
        assert await problem_repository.get_problem(db, inactive_id) is None
        assert all(problem.slug != f"inactive-generated-{key}" for problem in await problem_repository.list_problems(db))


@pytest.mark.asyncio
async def test_practice_catalogue_paginates_and_filters_user_progress(client):
    headers = await _headers(client)
    user_response = await client.get("/auth/me", headers=headers)
    assert user_response.status_code == 200
    user_id = user_response.json()["id"]
    key = uuid4().hex[:8]
    async with AsyncSessionLocal() as db:
        problems = [
            Problem(
                title=f"Array challenge {key} {index:02}",
                slug=f"array-challenge-{key}-{index:02}",
                difficulty="Easy",
                category="Arrays",
                description="Given a sequence of values, return the value at the requested position.",
                input_format="integer",
                output_format="integer",
                constraints="n > 0",
                is_active=True,
            )
            for index in range(23)
        ]
        db.add_all(problems)
        await db.flush()
        db.add_all([
            CodeSubmission(
                user_id=user_id,
                problem_id=problems[0].id,
                language="python",
                source_code="print(1)",
                verdict="Accepted",
            ),
            CodeSubmission(
                user_id=user_id,
                problem_id=problems[1].id,
                language="python",
                source_code="print(1)",
                verdict="Wrong Answer",
            ),
        ])
        await db.commit()

    params = {"q": f"Array challenge {key}", "page_size": 10}
    first_page = await client.get("/api/v1/practice/problems", headers=headers, params=params)
    second_page = await client.get("/api/v1/practice/problems", headers=headers, params={**params, "page": 2})
    final_page = await client.get("/api/v1/practice/problems", headers=headers, params={**params, "page": 3})

    assert first_page.status_code == second_page.status_code == final_page.status_code == 200
    first, second, final = first_page.json(), second_page.json(), final_page.json()
    assert [first["total"], second["total"], final["total"]] == [23, 23, 23]
    assert [len(first["items"]), len(second["items"]), len(final["items"])] == [10, 10, 3]
    all_ids = [item["id"] for page in (first, second, final) for item in page["items"]]
    assert len(all_ids) == len(set(all_ids)) == 23

    solved = await client.get(
        "/api/v1/practice/problems",
        headers=headers,
        params={**params, "status": "solved"},
    )
    attempted = await client.get(
        "/api/v1/practice/problems",
        headers=headers,
        params={**params, "status": "attempted"},
    )
    unsolved = await client.get(
        "/api/v1/practice/problems",
        headers=headers,
        params={**params, "status": "unsolved"},
    )
    assert solved.json()["total"] == 1
    assert solved.json()["items"][0]["status"] == "solved"
    assert attempted.json()["total"] == 1
    assert attempted.json()["items"][0]["status"] == "attempted"
    assert unsolved.json()["total"] == 22
    progress = await client.get("/api/v1/practice/summary", headers=headers)
    assert progress.status_code == 200
    assert progress.json()["solved"] == 1
    assert progress.json()["attempted"] == 2


@pytest.mark.asyncio
async def test_catalogue_search_filters_verified_topics_and_flags_placeholder_content(client):
    headers = await _headers(client)
    user_response = await client.get("/auth/me", headers=headers)
    assert user_response.status_code == 200
    user_id = user_response.json()["id"]
    key = uuid4().hex[:8]
    async with AsyncSessionLocal() as db:
        placeholder = Problem(
            title=f"Catalog page {key} 01",
            slug=f"catalog-page-quality-{key}",
            difficulty="Easy",
            category="Arrays",
            description="Return the requested value.",
            input_format="integer",
            output_format="integer",
            constraints="n > 0",
            is_active=True,
        )
        two_sum = Problem(
            title=f"Two Sum {key}",
            slug=f"two-sum-quality-{key}",
            difficulty="Easy",
            category="Arrays",
            description="Given an integer array and a target, return the indices of two values that sum to the target.",
            input_format="integer array and target",
            output_format="two indices",
            constraints="2 <= nums.length <= 1000",
            is_active=True,
        )
        graph = Problem(
            title=f"Shortest Path {key}",
            slug=f"shortest-path-quality-{key}",
            difficulty="Hard",
            category="Graphs",
            description="Given a weighted graph, find the minimum-cost path between the requested vertices.",
            input_format="graph and two vertices",
            output_format="minimum path cost",
            constraints="1 <= vertices <= 1000",
            is_active=True,
        )
        descriptive_problem_title = Problem(
            title=f"Problem Statement {key}",
            slug=f"problem-statement-quality-{key}",
            difficulty="Easy",
            category="Other",
            description="Given a sequence, return the value at the requested position.",
            input_format="sequence and index",
            output_format="value",
            constraints="n > 0",
            is_active=True,
        )
        db.add_all([placeholder, two_sum, graph, descriptive_problem_title])
        await db.flush()
        db.add_all([
            ProblemTag(problem_id=two_sum.id, tag="Hashing"),
            ProblemTag(problem_id=two_sum.id, tag="Arrays"),
            ProblemTag(problem_id=graph.id, tag="Graphs"),
        ])
        db.add(CodeSubmission(
            user_id=user_id,
            problem_id=placeholder.id,
            language="python",
            source_code="print(1)",
            verdict="Accepted",
        ))
        await db.commit()
        placeholder_id = placeholder.id

    tag_search = await client.get(
        "/api/v1/practice/problems",
        headers=headers,
        params={"q": "Hashing"},
    )
    topic_filter = await client.get(
        "/api/v1/practice/problems",
        headers=headers,
        params={"topic": "Graphs"},
    )
    category_and_difficulty = await client.get(
        "/api/v1/practice/problems",
        headers=headers,
        params={"category": "Arrays", "difficulty": "easy", "q": key},
    )
    difficulty_sort = await client.get(
        "/api/v1/practice/problems",
        headers=headers,
        params={"q": key, "sort_by": "difficulty"},
    )
    ready_only = await client.get(
        "/api/v1/practice/problems",
        headers=headers,
        params={"q": key, "ready_only": "true"},
    )
    detail = await client.get(
        f"/api/v1/practice/problems/{placeholder_id}",
        headers=headers,
    )
    rejected_submission = await client.post(
        "/api/v1/compiler/submit",
        headers=headers,
        json={
            "problem_id": placeholder_id,
            "language": "python",
            "source_code": "print(1)",
        },
    )

    assert tag_search.status_code == 200
    assert [item["title"] for item in tag_search.json()["items"]] == [f"Two Sum {key}"]
    assert topic_filter.status_code == 200
    assert [item["title"] for item in topic_filter.json()["items"]] == [f"Shortest Path {key}"]
    assert category_and_difficulty.status_code == 200
    assert [item["title"] for item in category_and_difficulty.json()["items"]] == [f"Two Sum {key}"]
    assert difficulty_sort.status_code == 200
    assert [item["difficulty"] for item in difficulty_sort.json()["items"]] == ["Easy", "Easy", "Hard"]
    assert ready_only.status_code == 200
    assert {item["title"] for item in ready_only.json()["items"]} == {
        f"Two Sum {key}",
        f"Shortest Path {key}",
        f"Problem Statement {key}",
    }
    assert detail.status_code == 200
    assert detail.json()["title"] is None
    assert detail.json()["metadata_status"] == "needs_repair"
    assert detail.json()["can_solve"] is False
    assert "placeholder content" in " ".join(detail.json()["metadata_warnings"])
    assert rejected_submission.status_code == 422
    assert "metadata needs repair" in rejected_submission.json()["detail"].lower()
    progress = await client.get("/api/v1/practice/summary", headers=headers)
    assert progress.status_code == 200
    assert progress.json()["solved"] == 0
    assert progress.json()["attempted"] == 0
