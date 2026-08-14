from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.models.roadmap import (
    Roadmap,
    RoadmapWeek,
    RoadmapTask,
)


class RoadmapRepository:
    """
    Repository for all roadmap database operations.
    """

    # ======================================================
    # ROADMAP
    # ======================================================

    def create_roadmap(
        self,
        db: Session,
        roadmap: Roadmap,
    ) -> Roadmap:

        db.add(roadmap)
        db.flush()

        return roadmap

    def get_active_roadmap(
        self,
        db: Session,
        user_id: str,
    ) -> Optional[Roadmap]:

        return (
            db.query(Roadmap)
            .options(
                joinedload(Roadmap.weeks)
                .joinedload(RoadmapWeek.tasks)
            )
            .filter(
                Roadmap.user_id == user_id,
                Roadmap.status == "ACTIVE",
            )
            .first()
        )

    def delete_user_roadmaps(
        self,
        db: Session,
        user_id: str,
    ):

        (
            db.query(Roadmap)
            .filter(Roadmap.user_id == user_id)
            .delete()
        )

    # ======================================================
    # WEEK
    # ======================================================

    def create_week(
        self,
        db: Session,
        week: RoadmapWeek,
    ) -> RoadmapWeek:

        db.add(week)
        db.flush()

        return week

    def get_current_week(
        self,
        db: Session,
        roadmap_id: int,
    ) -> Optional[RoadmapWeek]:

        return (
            db.query(RoadmapWeek)
            .filter(
                RoadmapWeek.roadmap_id == roadmap_id,
                RoadmapWeek.completion < 100,
            )
            .order_by(
                RoadmapWeek.week_number.asc()
            )
            .first()
        )

    # ======================================================
    # TASK
    # ======================================================

    def create_task(
        self,
        db: Session,
        task: RoadmapTask,
    ) -> RoadmapTask:

        db.add(task)
        db.flush()

        return task

    def get_task(
        self,
        db: Session,
        task_id: int,
    ) -> Optional[RoadmapTask]:

        return (
            db.query(RoadmapTask)
            .filter(
                RoadmapTask.id == task_id
            )
            .first()
        )

    def get_today_task(
        self,
        db: Session,
        roadmap_id: int,
    ) -> Optional[RoadmapTask]:

        weeks = (
            db.query(RoadmapWeek)
            .options(
                joinedload(RoadmapWeek.tasks)
            )
            .filter(
                RoadmapWeek.roadmap_id == roadmap_id
            )
            .order_by(
                RoadmapWeek.week_number
            )
            .all()
        )

        for week in weeks:

            for task in week.tasks:

                if not task.completed:
                    return task

        return None

    # ======================================================
    # PROGRESS
    # ======================================================

    def calculate_progress(
        self,
        roadmap: Roadmap,
    ) -> int:

        total_tasks = 0
        completed_tasks = 0

        for week in roadmap.weeks:

            total_tasks += len(week.tasks)

            completed_tasks += len(
                [
                    task
                    for task in week.tasks
                    if task.completed
                ]
            )

        if total_tasks == 0:
            return 0

        return int(
            completed_tasks
            / total_tasks
            * 100
        )

    def update_progress(
        self,
        db: Session,
        roadmap: Roadmap,
    ):

        roadmap.progress = self.calculate_progress(
            roadmap
        )

        for week in roadmap.weeks:

            total = len(week.tasks)

            if total == 0:

                week.completion = 0

                continue

            completed = len(
                [
                    task
                    for task in week.tasks
                    if task.completed
                ]
            )

            week.completion = int(
                completed
                / total
                * 100
            )

        db.commit()

        db.refresh(roadmap)

        return roadmap

    # ======================================================
    # SAVE
    # ======================================================

    def commit(
        self,
        db: Session,
    ):

        db.commit()

    def rollback(
        self,
        db: Session,
    ):

        db.rollback()

    def refresh(
        self,
        db: Session,
        obj,
    ):

        db.refresh(obj)


roadmap_repository = RoadmapRepository()