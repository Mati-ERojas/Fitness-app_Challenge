from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from src.models.user import User
from src.schemas.user import UserCreate

pwd_context = PasswordHash.recommended()


class UserService:
    @staticmethod
    def normalize_email(email: str) -> str:
        return email.strip().lower()

    @staticmethod
    def get_password_hash(password: str) -> str:
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def create_user(
        db: Session,
        user_in: UserCreate,
        *,
        commit: bool = True,
    ) -> User:
        normalized_email = UserService.normalize_email(user_in.email)
        
        # Check if email already exists using select() and db.scalar()
        stmt = select(User).where(User.email == normalized_email)
        existing_user = db.scalar(stmt)
        if existing_user:
            raise ValueError("Email already registered")

        hashed_password = UserService.get_password_hash(user_in.password)

        db_user = User(
            first_name=user_in.first_name.strip(),
            last_name=user_in.last_name.strip(),
            email=normalized_email,
            password_hash=hashed_password,
            terms_accepted=user_in.terms_accepted,
        )

        try:
            db.add(db_user)
            if commit:
                db.commit()
                db.refresh(db_user)
            else:
                db.flush()
        except IntegrityError:
            db.rollback()
            raise ValueError("Email already registered")
        except Exception:
            db.rollback()
            raise

        return db_user

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> User | None:
        normalized_email = UserService.normalize_email(email)
        stmt = select(User).where(User.email == normalized_email)
        return db.scalar(stmt)


