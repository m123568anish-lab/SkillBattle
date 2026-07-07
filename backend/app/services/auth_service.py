from sqlalchemy.orm import Session

from app.core.security import (
    hash_password,
    verify_password,
)

from app.repositories.user_repository import (
    UserRepository,
)

from app.models.user import User
from app.schemas.user import UserRegister

user_repository = UserRepository()


class AuthService:

    def register(
        self,
        db: Session,
        data: UserRegister,
    ):

        existing = user_repository.get_by_email(
            db,
            data.email,
        )

        if existing:
            raise ValueError(
                "Email already exists"
            )

        user = User(
            full_name=data.full_name,
            email=data.email,
            password_hash=hash_password(
                data.password
            ),
        )

        return user_repository.create(
            db,
            user,
        )

    def get_user_by_email(
        self,
        db: Session,
        email: str,
    ):
        return user_repository.get_by_email(db, email)

    def login(
        self,
        db: Session,
        email: str,
        password: str,
    ):

        user = user_repository.get_by_email(
            db,
            email,
        )

        if not user:
            return None

        if not verify_password(
            password,
            user.password_hash,
        ):
            return None

        return user


auth_service = AuthService()


def create_user(db: Session, data: UserRegister):
    return auth_service.register(db, data)


def get_user_by_email(db: Session, email: str):
    return auth_service.get_user_by_email(db, email)


def authenticate_user(db: Session, email: str, password: str):
    return auth_service.login(db, email, password)