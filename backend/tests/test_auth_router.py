import hashlib
from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from src.database import Base
from src.dependencies.database import get_db
from src.main import app
from src.models.session import UserSession
from src.models.user import User
from src.routers import auth as auth_router_module
from src.services.rate_limiter import RateLimiter

API_PREFIX = "/api/v1/auth"
TEST_EMAIL = "alex@example.com"
TEST_PASSWORD = "StrongPassword123!"
MISSING_OVERRIDE = object()


@pytest.fixture
def test_session_factory():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    testing_session_factory = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
    )
    try:
        yield testing_session_factory
    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture
def client(test_session_factory):
    previous_override = app.dependency_overrides.get(get_db, MISSING_OVERRIDE)

    def override_get_db():
        db = test_session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    try:
        yield test_client
    finally:
        test_client.close()
        if previous_override is MISSING_OVERRIDE:
            app.dependency_overrides.pop(get_db, None)
        else:
            app.dependency_overrides[get_db] = previous_override


@pytest.fixture(autouse=True)
def isolated_login_rate_limiter(monkeypatch):
    monkeypatch.setattr(auth_router_module, "login_rate_limiter", RateLimiter())


def registration_payload(**overrides):
    payload = {
        "first_name": "Alex",
        "last_name": "Trainer",
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "terms_accepted": True,
    }
    payload.update(overrides)
    return payload


def register(client: TestClient) -> dict:
    response = client.post(
        f"{API_PREFIX}/register",
        json=registration_payload(),
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_register_success_persists_user_and_hashed_session_token(
    client, test_session_factory
):
    response = client.post(
        f"{API_PREFIX}/register",
        json=registration_payload(),
    )

    assert response.status_code == 201
    data = response.json()
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == TEST_EMAIL
    assert "password" not in data
    assert "password_hash" not in data["user"]

    token_hash = hashlib.sha256(data["access_token"].encode("utf-8")).hexdigest()
    with test_session_factory() as db:
        user = db.scalar(select(User).where(User.email == TEST_EMAIL))
        assert user is not None
        assert user.password_hash != TEST_PASSWORD

        session = db.scalar(
            select(UserSession).where(UserSession.token_hash == token_hash)
        )
        assert session is not None
        assert session.user_id == user.id
        assert session.token_hash != data["access_token"]


def test_register_duplicate_email_ignoring_case_and_spaces(client):
    register(client)

    response = client.post(
        f"{API_PREFIX}/register",
        json=registration_payload(email="  ALEX@EXAMPLE.COM  "),
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Email already registered"


@pytest.mark.parametrize(
    "invalid_payload",
    [
        registration_payload(email="not-an-email"),
        registration_payload(password="short"),
        registration_payload(terms_accepted=False),
    ],
)
def test_register_invalid_data_returns_422(client, invalid_payload):
    response = client.post(f"{API_PREFIX}/register", json=invalid_payload)

    assert response.status_code == 422


def test_login_success_and_token_authenticates_me(client):
    register(client)

    response = client.post(
        f"{API_PREFIX}/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["token_type"] == "bearer"
    assert "password" not in data
    assert "password_hash" not in data["user"]

    me_response = client.get(
        f"{API_PREFIX}/me",
        headers={"Authorization": f"Bearer {data['access_token']}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["id"] == data["user"]["id"]
    assert me_response.json()["email"] == TEST_EMAIL
    assert "password_hash" not in me_response.json()


def test_login_unknown_email_and_wrong_password_share_generic_error(client):
    register(client)

    unknown_email = client.post(
        f"{API_PREFIX}/login",
        json={"email": "missing@example.com", "password": TEST_PASSWORD},
    )
    wrong_password = client.post(
        f"{API_PREFIX}/login",
        json={"email": TEST_EMAIL, "password": "WrongPassword123!"},
    )

    assert unknown_email.status_code == 401
    assert wrong_password.status_code == 401
    assert unknown_email.json() == wrong_password.json()
    assert unknown_email.json()["detail"] == "Invalid email or password"
    assert unknown_email.headers["www-authenticate"] == "Bearer"


def test_login_returns_429_after_five_failed_attempts_and_retry_after(client):
    register(client)
    bad_credentials = {"email": TEST_EMAIL, "password": "WrongPassword123!"}

    for _ in range(5):
        response = client.post(f"{API_PREFIX}/login", json=bad_credentials)
        assert response.status_code == 401

    blocked = client.post(f"{API_PREFIX}/login", json=bad_credentials)

    assert blocked.status_code == 429
    assert blocked.json()["detail"] == (
        "Too many authentication attempts. Try again later."
    )
    retry_after = int(blocked.headers["retry-after"])
    assert 1 <= retry_after <= 900


def test_successful_login_clears_previous_failures(client):
    register(client)
    bad_credentials = {"email": TEST_EMAIL, "password": "WrongPassword123!"}

    for _ in range(4):
        response = client.post(f"{API_PREFIX}/login", json=bad_credentials)
        assert response.status_code == 401

    successful = client.post(
        f"{API_PREFIX}/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
    )
    assert successful.status_code == 200

    for _ in range(5):
        response = client.post(f"{API_PREFIX}/login", json=bad_credentials)
        assert response.status_code == 401

    blocked = client.post(f"{API_PREFIX}/login", json=bad_credentials)
    assert blocked.status_code == 429


def test_me_without_token_returns_401(client):
    response = client.get(f"{API_PREFIX}/me")

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_me_with_invalid_token_returns_401(client):
    response = client.get(
        f"{API_PREFIX}/me",
        headers={"Authorization": "Bearer invalid-token"},
    )

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_me_with_revoked_token_returns_401(client, test_session_factory):
    token = register(client)["access_token"]
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()

    with test_session_factory() as db:
        session = db.scalar(
            select(UserSession).where(UserSession.token_hash == token_hash)
        )
        assert session is not None
        session.revoked_at = datetime.now(UTC)
        db.commit()

    response = client.get(
        f"{API_PREFIX}/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401


def test_logout_revokes_token_and_prevents_reuse(client, test_session_factory):
    token = register(client)["access_token"]
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    headers = {"Authorization": f"Bearer {token}"}

    logout_response = client.post(f"{API_PREFIX}/logout", headers=headers)

    assert logout_response.status_code == 204
    assert logout_response.content == b""
    with test_session_factory() as db:
        session = db.scalar(
            select(UserSession).where(UserSession.token_hash == token_hash)
        )
        assert session is not None
        assert session.revoked_at is not None

    me_response = client.get(f"{API_PREFIX}/me", headers=headers)
    second_logout_response = client.post(f"{API_PREFIX}/logout", headers=headers)
    assert me_response.status_code == 401
    assert second_logout_response.status_code == 401
