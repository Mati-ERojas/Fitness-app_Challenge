import pytest
from datetime import datetime, timezone, timedelta
import hashlib
import secrets
from sqlalchemy import create_engine, select, event, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.exc import IntegrityError

from src.database import Base
from src.models.user import User
from src.models.session import UserSession


@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_create_session_success(db_session):
    # 1. Create a user
    user = User(
        first_name="Alice",
        last_name="Smith",
        email="alice.smith@example.com",
        password_hash="fakehash",
        terms_accepted=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # 2. Generate opaque token & hash
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    # 3. Create session
    session = UserSession(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)

    assert session.id is not None
    assert len(session.id) == 36
    assert session.user_id == user.id
    assert session.token_hash == token_hash
    assert session.revoked_at is None
    assert session.expires_at.replace(tzinfo=timezone.utc) == expires_at
    assert len(user.sessions) == 1
    assert user.sessions[0].id == session.id


def test_token_hash_uniqueness(db_session):
    user = User(
        first_name="Bob",
        last_name="Builder",
        email="bob@builder.com",
        password_hash="fakehash",
        terms_accepted=True,
    )
    db_session.add(user)
    db_session.commit()

    token_hash = hashlib.sha256(b"same_token").hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(days=1)

    session_1 = UserSession(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db_session.add(session_1)
    db_session.commit()

    # Try to create another session with the same token_hash
    session_2 = UserSession(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db_session.add(session_2)

    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_user_session_relationship_bidirectional(db_session):
    # 1. Create a user
    user = User(
        first_name="David",
        last_name="Tenant",
        email="david.tenant@example.com",
        password_hash="fakehash",
        terms_accepted=True,
    )

    # 2. Create session without assigning user_id directly
    token_hash = hashlib.sha256(b"david_token").hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session = UserSession(
        token_hash=token_hash,
        expires_at=expires_at,
    )

    # 3. Associate via user.sessions.append(session)
    user.sessions.append(session)

    # 4. Check that session.user points to the same user
    assert session.user is user

    # 5. Persist both objects
    db_session.add(user)
    db_session.commit()

    # 6. Execute db_session.expire_all()
    db_session.expire_all()

    # 7. Retrieve user and session from SQLite
    saved_user = db_session.scalar(select(User).where(User.email == "david.tenant@example.com"))
    saved_session = db_session.scalar(select(UserSession).where(UserSession.token_hash == token_hash))

    # 8. Check that saved_session.user corresponds to saved_user
    assert saved_session.user.id == saved_user.id
    assert saved_session.user.email == saved_user.email

    # 9. Check that session is present in saved_user.sessions
    assert len(saved_user.sessions) == 1
    assert saved_user.sessions[0].id == saved_session.id


def test_sql_cascade_delete_user_sessions(db_session):
    # 1. Create and persist a user with a session
    user = User(
        first_name="Eve",
        last_name="Polastri",
        email="eve@polastri.com",
        password_hash="fakehash",
        terms_accepted=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    token_hash = hashlib.sha256(b"eve_token").hexdigest()
    session = UserSession(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(days=1),
    )
    db_session.add(session)
    db_session.commit()
    session_id = session.id
    user_id = user.id

    # 2. Execute direct SQL DELETE on users without using db_session.delete()
    db_session.execute(text("DELETE FROM users WHERE id = :user_id"), {"user_id": user_id})

    # 3. Confirm transaction
    db_session.commit()

    # 4. Confirm that SQLite deleted the session via ON DELETE CASCADE
    result = db_session.scalar(select(UserSession).where(UserSession.id == session_id))
    assert result is None



def test_cascade_delete_user_sessions(db_session):
    user = User(
        first_name="Charlie",
        last_name="Brown",
        email="charlie@brown.com",
        password_hash="fakehash",
        terms_accepted=True,
    )
    db_session.add(user)
    db_session.commit()

    token_hash = hashlib.sha256(b"charlie_token").hexdigest()
    session = UserSession(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(days=1),
    )
    db_session.add(session)
    db_session.commit()

    session_id = session.id

    # Delete user
    db_session.delete(user)
    db_session.commit()

    # Verify session was deleted in cascade
    result = db_session.scalar(select(UserSession).where(UserSession.id == session_id))
    assert result is None
