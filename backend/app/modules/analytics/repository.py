from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.api_request_log import ApiRequestLog


class AnalyticsRepository:

    def create(
        self,
        db: Session,
        log: ApiRequestLog,
    ):

        db.add(log)

        db.commit()

        db.refresh(log)

        return log

    def total_requests(
        self,
        db: Session,
    ):

        return db.query(ApiRequestLog).count()

    def average_response(
        self,
        db: Session,
    ):

        value = db.query(
            func.avg(ApiRequestLog.response_time)
        ).scalar()

        return value or 0

    def errors(
        self,
        db: Session,
    ):

        return (

            db.query(ApiRequestLog)

            .filter(ApiRequestLog.status_code >= 400)

            .count()

        )


analytics_repository = AnalyticsRepository()