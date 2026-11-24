import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from pydantic import ValidationError

from src.database import Base
from src.models.user import User
from src.schemas.user import UserCreate
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


def test_create_user_success(db_session):
    user_in = UserCreate(
        first_name="  John  ",
        last_name="  Doe  ",
        email="  JOHN.DOE@Example.com  ",
        password="SecurePassword123!",
        terms_accepted=True,
    )

    user = UserService.create_user(db_session, user_in)

    assert user.id is not None
    assert isinstance(user.id, str)
    assert len(user.id) == 36
    assert user.first_name == "John"
    assert user.last_name == "Doe"
    assert user.email == "john.doe@example.com"
    assert user.terms_accepted is True
    assert user.password_hash != "SecurePassword123!"
    assert user.password_hash.startswith("$argon2id$")


def test_terms_acceptance_validation():
    with pytest.raises(ValidationError):
        UserCreate(
            first_name="John",
            last_name="Doe",
            email="john.doe@example.com",
            password="SecurePassword123!",
            terms_accepted=False,
        )


def test_email_normalization_and_uniqueness(db_session):
    user_in_1 = UserCreate(
        first_name="Alice",
        last_name="Smith",
        email="Alice.Smith@Domain.com",
        password="SecurePassword123!",
        terms_accepted=True,
    )
    user_1 = UserService.create_user(db_session, user_in_1)
    assert user_1.email == "alice.smith@domain.com"
    assert user_1.terms_accepted is True

    # Attempt to create another user with same email (different casing/whitespace)
    user_in_2 = UserCreate(
        first_name="Alicia",
        last_name="Smitty",
        email="  ALICE.SMITH@DOMAIN.COM  ",
        password="AnotherPassword123!",
        terms_accepted=True,
    )

    with pytest.raises(ValueError, match="Email already registered"):
        UserService.create_user(db_session, user_in_2)


def test_password_hashing_and_verification(db_session):
    raw_password = "MySuperSecretPassword123!"
    hashed = UserService.get_password_hash(raw_password)

    assert hashed != raw_password
    assert UserService.verify_password(raw_password, hashed) is True
    assert UserService.verify_password("WrongPassword123!", hashed) is False


def test_get_user_by_email(db_session):
    user_in = UserCreate(
        first_name="Bob",
        last_name="Builder",
        email="bob@builder.com",
        password="SecurePassword123!",
        terms_accepted=True,
    )
    UserService.create_user(db_session, user_in)

    found = UserService.get_user_by_email(db_session, "  BOB@BUILDER.COM  ")
    assert found is not None
    assert found.first_name == "Bob"
    assert found.terms_accepted is True

    not_found = UserService.get_user_by_email(db_session, "nonexistent@builder.com")
    assert not_found is None

