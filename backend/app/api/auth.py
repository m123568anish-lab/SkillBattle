from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.orm import Session

from app.database.database import get_db

from app.schemas.user import (
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
    RefreshTokenRequest,
)

from app.services.auth_service import (
    create_user,
    get_user_by_email,
    authenticate_user,
)

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
)

from app.database.models.user import User

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    user: UserRegister,
    db: Session = Depends(get_db),
):
    existing = get_user_by_email(
        db,
        user.email,
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already exists",
        )

    return create_user(
        db,
        user,
    )


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    credentials: UserLogin,
    db: Session = Depends(get_db),
):
    user = authenticate_user(
        db,
        credentials.email,
        credentials.password,
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    return {
        "access_token": create_access_token(
            {
                "sub": user.email,
                "user_id": user.id,
            }
        ),
        "refresh_token": create_refresh_token(
            {
                "sub": user.email,
                "user_id": user.id,
            }
        ),
        "token_type": "bearer",
    }


@router.post(
    "/refresh",
    response_model=TokenResponse,
)
def refresh(
    request: RefreshTokenRequest,
):
    payload = decode_token(
        request.refresh_token,
    )

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token",
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token",
        )

    email = payload.get("sub")
    user_id = payload.get("user_id")

    return {
        "access_token": create_access_token(
            {
                "sub": email,
                "user_id": user_id,
            }
        ),
        "refresh_token": create_refresh_token(
            {
                "sub": email,
                "user_id": user_id,
            }
        ),
        "token_type": "bearer",
    }


@router.post("/logout")
def logout():
    return {
        "message": "Logout successful"
    }


@router.get(
    "/me",
    response_model=UserResponse,
)
def me(
    current_user: User = Depends(
        get_current_user,
    ),
):
    return current_user