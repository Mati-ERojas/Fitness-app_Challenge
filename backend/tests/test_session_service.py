import hashlib
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.config.settings import settings
from src.database import Base
from src.models.session import UserSession
from src.models.user import User
from src.services.session import SessionService


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


@pytest.fixture
def user(db_session):
    db_user = User(
        first_name="Taylor",
        last_name="Trainer",
        email="taylor@example.com",
        password_hash="test-hash",
        terms_accepted=True,
    )
    db_session.add(db_user)
    db_session.commit()
    db_session.refresh(db_user)
    return db_user


def _make_session(db_session, user_id, *, expires_at, revoked_at=None, token="test-token"):
    db_session_obj = UserSession(
        user_id=user_id,
        token_hash=hashlib.sha256(token.encode("utf-8")).hexdigest(),
        expires_at=expires_at,
        revoked_at=revoked_at,
    )
    db_session.add(db_session_obj)
    db_session.commit()
    db_session.refresh(db_session_obj)
    return db_session_obj


def test_create_session_persists_only_token_hash(db_session, user, monkeypatch):
    raw_token = "opaque-session-token"
    monkeypatch.setattr("src.services.session.secrets.token_urlsafe", lambda _: raw_token)
    before_create = datetime.now(timezone.utc)

    returned_token, session = SessionService.create_session(db_session, user)

    expected_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    persisted = db_session.scalar(select(UserSession).where(UserSession.id == session.id))
    assert returned_token == raw_token
    assert session.user_id == user.id
    assert session.token_hash == expected_hash
    assert session.token_hash != raw_token
    assert persisted.token_hash == expected_hash
    assert len(persisted.token_hash) == 64
    assert session.revoked_at is None
    expires_at = SessionService._normalize_utc(session.expires_at)
    assert before_create + timedelta(days=settings.SESSION_EXPIRE_DAYS) <= expires_at
    assert expires_at <= datetime.now(timezone.utc) + timedelta(
        days=settings.SESSION_EXPIRE_DAYS
    )


def test_get_valid_session_returns_unrevoked_unexpired_session(db_session, user):
    session = _make_session(
        db_session,
        user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=1),
    )

    assert SessionService.get_valid_session(db_session, "test-token").id == session.id # type: ignore


@pytest.mark.parametrize(
    ("expires_at", "revoked_at", "token"),
    [
        (datetime.now(timezone.utc) + timedelta(days=1), None, "missing-token"),
        (datetime.now(timezone.utc) - timedelta(seconds=1), None, "expired-token"),
        (
            datetime.now(timezone.utc) + timedelta(days=1),
            datetime.now(timezone.utc),
            "revoked-token",
        ),
    ],
)
def test_get_valid_session_returns_none_for_invalid_session(
    db_session, user, expires_at, revoked_at, token
):
    if token != "missing-token":
        _make_session(
            db_session,
            user.id,
            expires_at=expires_at,
            revoked_at=revoked_at,
            token=token,
        )

    assert SessionService.get_valid_session(db_session, token) is None


def test_revoke_session_is_persisted_and_idempotent(db_session, user):
    session = _make_session(
        db_session,
        user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=1),
    )

    SessionService.revoke_session(db_session, session)
    first_revoked_at = SessionService._normalize_utc(session.revoked_at) # type: ignore
    SessionService.revoke_session(db_session, session)
    db_session.refresh(session)

    assert SessionService._normalize_utc(session.revoked_at) == first_revoked_at # type: ignore
    assert first_revoked_at.tzinfo == timezone.utc


def test_revoke_all_user_sessions_only_revokes_active_sessions(db_session, user):
    active = _make_session(
        db_session,
        user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=1),
        token="active-token",
    )
    already_revoked_at = datetime.now(timezone.utc) - timedelta(hours=1)
    revoked = _make_session(
        db_session,
        user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=1),
        revoked_at=already_revoked_at,
        token="revoked-token",
    )
    other_user = User(
        first_name="Other",
        last_name="User",
        email="other@example.com",
        password_hash="test-hash",
        terms_accepted=True,
    )
    db_session.add(other_user)
    db_session.commit()
    other_active = _make_session(
        db_session,
        other_user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=1),
        token="other-active-token",
    )

    SessionService.revoke_all_user_sessions(db_session, user.id)
    db_session.refresh(active)
    db_session.refresh(revoked)
    db_session.refresh(other_active)

    assert active.revoked_at is not None
    assert revoked.revoked_at == already_revoked_at.replace(tzinfo=None)
    assert other_active.revoked_at is None
