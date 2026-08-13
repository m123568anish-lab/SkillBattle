from sqlalchemy.orm import Session

from .repository import analytics_repository


class AnalyticsService:

    def dashboard(
        self,
        db: Session,
    ):

        return {

            "total_requests":
            analytics_repository.total_requests(db),

            "average_response_time":
            analytics_repository.average_response(db),

            "total_errors":
            analytics_repository.errors(db),

        }


analytics_service = AnalyticsService()