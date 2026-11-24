import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from src.config.settings import settings
from src.models.session import UserSession
from src.models.user import User


class SessionService:
    @staticmethod
    def _normalize_utc(value: datetime) -> datetime:
        """Treat SQLite's naive datetimes as UTC and normalize aware values."""
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    @staticmethod
    def create_session(
        db: Session,
        user: User,
        *,
        commit: bool = True,
    ) -> tuple[str, UserSession]:
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        now = datetime.now(timezone.utc)
        db_session = UserSession(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=now + timedelta(days=settings.SESSION_EXPIRE_DAYS),
        )

        try:
            db.add(db_session)
            if commit:
                db.commit()
                db.refresh(db_session)
            else:
                db.flush()
        except Exception:
            db.rollback()
            raise

        return token, db_session

    @staticmethod
    def get_valid_session(db: Session, token: str) -> UserSession | None:
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        stmt = select(UserSession).where(UserSession.token_hash == token_hash)
        db_session = db.scalar(stmt)
        if db_session is None or db_session.revoked_at is not None:
            return None

        expires_at = SessionService._normalize_utc(db_session.expires_at)
        if expires_at <= datetime.now(timezone.utc):
            return None

        return db_session

    @staticmethod
    def revoke_session(db: Session, session: UserSession) -> None:
        if session.revoked_at is not None:
            return

        session.revoked_at = datetime.now(timezone.utc)
        try:
            db.commit()
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def revoke_all_user_sessions(db: Session, user_id: str) -> None:
        now = datetime.now(timezone.utc)
        stmt = (
            update(UserSession)
            .where(
                UserSession.user_id == user_id,
                UserSession.revoked_at.is_(None),
            )
            .values(revoked_at=now)
        )

        try:
            db.execute(stmt)
            db.commit()
        except Exception:
            db.rollback()
            raise
