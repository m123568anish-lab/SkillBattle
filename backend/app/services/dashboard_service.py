from sqlalchemy.orm import Session

from app.repositories.xp_repository import (
    XPRepository,
)

from app.repositories.profile_repository import (
    ProfileRepository,
)

xp_repository = XPRepository()

profile_repository = ProfileRepository()


class DashboardService:

    def get_dashboard(
        self,
        db: Session,
        user_id: str,
    ):

        xp = xp_repository.get_by_user(
            db,
            user_id,
        )

        profile = profile_repository.get_by_user(
            db,
            user_id,
        )

        return {
            "profile": profile,
            "xp": xp,
        }


dashboard_service = DashboardService()


def get_dashboard(db: Session, user_id: str):
    return dashboard_service.get_dashboard(db, user_id)