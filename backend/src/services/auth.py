from sqlalchemy.orm import Session

from src.models.session import UserSession
from src.models.user import User
from src.schemas.user import UserCreate
from src.services.session import SessionService
from src.services.user import UserService


class AuthService:
    @staticmethod
    def register(db: Session, user_in: UserCreate) -> tuple[User, str]:
        try:
            user = UserService.create_user(db, user_in, commit=False)
            token, _ = SessionService.create_session(db, user, commit=False)
            db.commit()
            return user, token
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def login(db: Session, email: str, password: str) -> tuple[User, str]:
        user = UserService.get_user_by_email(db, email)
        if user is None or not UserService.verify_password(
            password, user.password_hash
        ):
            raise ValueError("Invalid email or password")

        token, _ = SessionService.create_session(db, user)
        return user, token

    @staticmethod
    def logout(db: Session, session: UserSession) -> None:
        SessionService.revoke_session(db, session)
