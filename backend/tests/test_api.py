from collections.abc import AsyncIterator, Generator
from contextlib import asynccontextmanager

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app


test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSession = sessionmaker(bind=test_engine, autoflush=False, expire_on_commit=False)


@asynccontextmanager
async def no_op_lifespan(_app) -> AsyncIterator[None]:
    yield


app.router.lifespan_context = no_op_lifespan


def override_get_db() -> Generator[Session, None, None]:
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)


def create_user(client: TestClient, name: str, email: str) -> tuple[str, dict]:
    response = client.post(
        "/api/auth/register",
        json={"name": name, "email": email, "password": "accountability-password"},
    )
    assert response.status_code == 201
    payload = response.json()
    return payload["access_token"], payload["user"]


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def create_goal(client: TestClient, token: str, title: str, target: str) -> int:
    response = client.post(
        "/api/goals",
        headers=auth(token),
        json={
            "title": title,
            "category": "Health",
            "description": "Build a consistent running habit",
            "daily_target": target,
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_partner_matching_checkins_and_coach_points(client: TestClient) -> None:
    first_token, first_user = create_user(client, "Asha", "asha@example.com")
    second_token, second_user = create_user(client, "Ben", "ben@example.com")
    first_goal = create_goal(client, first_token, "Daily run", "Run for 15 minutes")
    second_goal = create_goal(client, second_token, "Go running", "Run for 20 minutes")

    matches = client.get(f"/api/matches?goal_id={first_goal}", headers=auth(first_token))
    assert matches.status_code == 200
    assert matches.json()[0]["user_id"] == second_user["id"]
    assert matches.json()[0]["match_score"] > 0

    created = client.post(
        "/api/groups",
        headers=auth(first_token),
        json={"goal_id": first_goal, "name": "Morning runners"},
    )
    assert created.status_code == 201
    invite_code = created.json()["invite_code"]
    joined = client.post(
        "/api/groups/join",
        headers=auth(second_token),
        json={"invite_code": invite_code.lower(), "goal_id": second_goal},
    )
    assert joined.status_code == 201
    group_id = joined.json()["id"]
    assert joined.json()["member_count"] == 2

    encouraged = client.post(
        f"/api/groups/{group_id}/encouragements",
        headers=auth(first_token),
        json={"recipient_id": second_user["id"], "message": "Let's go for that run!"},
    )
    assert encouraged.status_code == 201
    assert encouraged.json()["coach_point_awarded"] is False

    second_check_in = client.post(
        f"/api/groups/{group_id}/check-ins",
        headers=auth(second_token),
        json={"note": "Got my run in."},
    )
    assert second_check_in.status_code == 201
    first_check_in = client.post(
        f"/api/groups/{group_id}/check-ins",
        headers=auth(first_token),
        json={"note": "Partner run done."},
    )
    assert first_check_in.status_code == 201
    duplicate = client.post(
        f"/api/groups/{group_id}/check-ins",
        headers=auth(first_token),
        json={},
    )
    assert duplicate.status_code == 409

    refreshed = client.get(f"/api/groups/{group_id}", headers=auth(first_token))
    assert refreshed.status_code == 200
    group = refreshed.json()
    assert group["team_streak"] == 1
    first_member = next(item for item in group["members"] if item["user_id"] == first_user["id"])
    assert first_member["coach_points"] == 1
    assert all(item["today_completed"] for item in group["members"])
    assert group["encouragements"][0]["coach_point_awarded"] is True


def test_goals_and_circle_activity_are_private(client: TestClient) -> None:
    owner_token, _ = create_user(client, "Owner", "owner@example.com")
    stranger_token, _ = create_user(client, "Stranger", "stranger@example.com")
    goal_id = create_goal(client, owner_token, "Read", "Read for 20 minutes")
    circle = client.post(
        "/api/groups",
        headers=auth(owner_token),
        json={"goal_id": goal_id, "name": "Reading circle"},
    ).json()

    assert client.get("/api/goals", headers=auth(stranger_token)).json() == []
    private_group = client.get(f"/api/groups/{circle['id']}", headers=auth(stranger_token))
    assert private_group.status_code == 403
    unauthorized = client.get("/api/groups")
    assert unauthorized.status_code == 401


def test_leaving_a_circle_releases_the_daily_goal(client: TestClient) -> None:
    first_token, _ = create_user(client, "First", "first@example.com")
    second_token, _ = create_user(client, "Second", "second@example.com")
    first_goal = create_goal(client, first_token, "Stretch", "Stretch for 10 minutes")
    second_goal = create_goal(client, second_token, "Walk", "Walk for 15 minutes")
    circle = client.post(
        "/api/groups",
        headers=auth(first_token),
        json={"goal_id": first_goal, "name": "Daily movers"},
    ).json()
    joined = client.post(
        "/api/groups/join",
        headers=auth(second_token),
        json={"invite_code": circle["invite_code"], "goal_id": second_goal},
    )
    assert joined.status_code == 201

    left = client.delete(
        f"/api/groups/{circle['id']}/membership",
        headers=auth(first_token),
    )
    assert left.status_code == 204
    released_goals = client.get("/api/goals", headers=auth(first_token)).json()
    assert released_goals[0]["in_circle"] is False
    remaining_view = client.get(f"/api/groups/{circle['id']}", headers=auth(second_token))
    assert remaining_view.status_code == 200
    assert remaining_view.json()["member_count"] == 1
