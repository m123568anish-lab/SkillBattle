from sqlalchemy.orm import Session

from .repository import (
    developer_portal_repository,
)


class DeveloperPortalService:

    def dashboard(

        self,

        db: Session,

        current_user,

    ):

        return {

            "api_keys":

            developer_portal_repository.total_keys(

                db,

                current_user.id,

            ),

            "total_requests": 0,

            "active_projects": 0,

            "sdk_downloads": 0,

        }


developer_portal_service = DeveloperPortalService()