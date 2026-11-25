from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from src.dependencies.auth import get_current_session, get_current_user
from src.dependencies.database import get_db
from src.models.session import UserSession
from src.models.user import User
from src.schemas.auth import AuthResponse, LoginRequest
from src.schemas.user import UserCreate, UserResponse
from src.services.auth import AuthService
from src.services.rate_limiter import login_rate_limiter

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(user_in: UserCreate, db: Session = Depends(get_db)) -> AuthResponse:
    try:
        user, token = AuthService.register(db, user_in)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        ) from exc

    return AuthResponse(access_token=token,  user=UserResponse.model_validate(user))


@router.post(
    "/login",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
)
def login(
    login_in: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> AuthResponse:
    ip_address = request.client.host if request.client is not None else "unknown"

    with login_rate_limiter.lock_ip(ip_address):
        if not login_rate_limiter.can_attempt(ip_address):
            retry_after = login_rate_limiter.get_retry_after(ip_address)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many authentication attempts. Try again later.",
                headers={"Retry-After": str(retry_after)},
            )

        try:
            user, token = AuthService.login(db, login_in.email, login_in.password)
        except ValueError as exc:
            login_rate_limiter.record_failure(ip_address)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            ) from exc
        else:
            login_rate_limiter.clear(ip_address)

    return AuthResponse(access_token=token,  user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def get_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def logout(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
    user_session: UserSession = Depends(get_current_session),
) -> Response:
    AuthService.logout(db, user_session)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
