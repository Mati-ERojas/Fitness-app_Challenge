import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, func, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool
from src.database import Base
from src.dependencies.database import get_db
from src.models.session import UserSession
from src.models.user import User
from src.routers.auth import router as auth_router
from src.schemas.user import UserCreate
from src.services.auth import AuthService
from src.services.session import SessionService
from src.services.user import UserService


@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def make_user_input(
    *,
    email: str = "alex@example.com",
    password: str = "StrongPassword123!",
) -> UserCreate:
    return UserCreate(
        first_name="Alex",
        last_name="Trainer",
        email=email,
        password=password,
        terms_accepted=True,
    )


def create_user(db_session: Session, *, email: str = "alex@example.com") -> User:
    return UserService.create_user(db_session, make_user_input(email=email))


def test_register_creates_user_and_session(db_session):
    user, token = AuthService.register(db_session, make_user_input())

    assert user.id is not None
    assert user.email == "alex@example.com"
    assert user.password_hash != "StrongPassword123!"
    assert token
    assert SessionService.get_valid_session(db_session, token) is not None


def test_register_commits_once(db_session):
    commit_count = 0

    def count_commits(session):
        nonlocal commit_count
        commit_count += 1

    event.listen(db_session, "before_commit", count_commits)

    AuthService.register(db_session, make_user_input())

    assert commit_count == 1


def test_register_rolls_back_user_if_session_creation_fails(db_session, monkeypatch):
    def fail_token_generation(size):
        raise RuntimeError("token generation failed")

    monkeypatch.setattr(
        "src.services.session.secrets.token_urlsafe",
        fail_token_generation,
    )

    with pytest.raises(RuntimeError, match="token generation failed"):
        AuthService.register(db_session, make_user_input())

    assert db_session.scalar(
        select(User).where(User.email == "alex@example.com")
    ) is None
    assert db_session.scalar(select(func.count()).select_from(UserSession)) == 0


def test_register_duplicate_email_propagates_business_error(db_session):
    AuthService.register(db_session, make_user_input())

    with pytest.raises(ValueError, match="Email already registered"):
        AuthService.register(db_session, make_user_input(email=" ALEX@example.com "))

    session_count = db_session.scalar(select(func.count()).select_from(UserSession))
    assert session_count == 1


def test_login_with_valid_credentials_returns_user_and_session(db_session):
    user = create_user(db_session)

    logged_in_user, token = AuthService.login(
        db_session, " ALEX@EXAMPLE.COM ", "StrongPassword123!"
    )

    assert logged_in_user.id == user.id
    assert token
    assert SessionService.get_valid_session(db_session, token) is not None


def test_login_invalid_credentials_have_same_error(db_session):
    create_user(db_session)

    errors = []
    for email, password in (
        ("missing@example.com", "StrongPassword123!"),
        ("alex@example.com", "WrongPassword123!"),
    ):
        with pytest.raises(ValueError) as exc_info:
            AuthService.login(db_session, email, password)
        errors.append((type(exc_info.value), str(exc_info.value)))

    assert errors[0] == errors[1]
    assert errors[0][1] == "Invalid email or password"


def test_logout_revokes_session(db_session):
    user = create_user(db_session)
    _, token = AuthService.login(db_session, user.email, "StrongPassword123!")
    session = SessionService.get_valid_session(db_session, token)
    assert session is not None

    AuthService.logout(db_session, session)

    assert SessionService.get_valid_session(db_session, token) is None


def test_logout_reuses_current_session_dependency(db_session, monkeypatch):
    user = create_user(db_session)
    _, token = AuthService.login(db_session, user.email, "StrongPassword123!")
    original_get_valid_session = SessionService.get_valid_session
    validation_calls = 0

    def count_validations(db, raw_token):
        nonlocal validation_calls
        validation_calls += 1
        return original_get_valid_session(db, raw_token)

    monkeypatch.setattr(
        SessionService,
        "get_valid_session",
        staticmethod(count_validations),
    )

    app = FastAPI()
    app.include_router(auth_router)

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    response = TestClient(app).post(
        "/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 204
    assert validation_calls == 1


def test_register_propagates_unexpected_user_service_error(db_session, monkeypatch):
    def fail_to_create_user(db, user_in, *, commit=True):
        raise RuntimeError("database unavailable")

    monkeypatch.setattr(UserService, "create_user", fail_to_create_user)

    with pytest.raises(RuntimeError, match="database unavailable"):
        AuthService.register(db_session, make_user_input())


def test_login_propagates_unexpected_session_service_error(db_session, monkeypatch):
    user = create_user(db_session)

    def fail_to_create_session(db, user):
        raise RuntimeError("session storage unavailable")

    monkeypatch.setattr(SessionService, "create_session", fail_to_create_session)

    with pytest.raises(RuntimeError, match="session storage unavailable"):
        AuthService.login(db_session, user.email, "StrongPassword123!")
