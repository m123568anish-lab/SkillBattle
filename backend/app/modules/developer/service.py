from sqlalchemy.orm import Session

from app.models.developer_api_key import DeveloperApiKey

from .repository import developer_repository


class DeveloperService:

    def create_key(
        self,
        db: Session,
        current_user,
        name: str,
    ):

        key = DeveloperApiKey(

            user_id=current_user.id,

            name=name,

        )

        developer_repository.create(

            db,

            key,

        )

        db.commit()

        db.refresh(key)

        return key

    def list_keys(
        self,
        db: Session,
        current_user,
    ):

        return developer_repository.list(

            db,

            current_user.id,

        )


developer_service = DeveloperService()