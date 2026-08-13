from sqlalchemy.orm import Session

from app.models.developer_api_key import DeveloperApiKey


class DeveloperPortalRepository:

    def total_keys(
        self,
        db: Session,
        user_id: str,
    ):

        return (

            db.query(
                DeveloperApiKey
            )

            .filter(
                DeveloperApiKey.user_id == user_id
            )

            .count()

        )


developer_portal_repository = DeveloperPortalRepository()