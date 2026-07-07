from sqlalchemy.orm import Session

from app.models.developer_api_key import (
    DeveloperApiKey,
)


class DeveloperRepository:

    def create(
        self,
        db: Session,
        key: DeveloperApiKey,
    ):

        db.add(key)

        db.flush()

        return key

    def list(
        self,
        db: Session,
        user_id: str,
    ):

        return (

            db.query(DeveloperApiKey)

            .filter(
                DeveloperApiKey.user_id == user_id
            )

            .all()

        )
    def get_api_key(
    self,
    db: Session,
    api_key: str,
):

     return (
        db.query(DeveloperApiKey)
        .filter(
            DeveloperApiKey.api_key == api_key,
            DeveloperApiKey.active == True,
        )
        .first()
    )


developer_repository = DeveloperRepository()