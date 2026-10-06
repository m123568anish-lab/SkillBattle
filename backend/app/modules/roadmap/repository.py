from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

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

    async def create_roadmap(
        self,
        db: AsyncSession,
        roadmap: Roadmap,
    ) -> Roadmap:
        db.add(roadmap)
        await db.flush()
        return roadmap

    async def get_active_roadmap(
        self,
        db: AsyncSession,
        user_id: str,
    ) -> Optional[Roadmap]:
        result = await db.execute(
            select(Roadmap)
            .options(joinedload(Roadmap.weeks).joinedload(RoadmapWeek.tasks))
            .where(Roadmap.user_id == user_id, Roadmap.status == "ACTIVE")
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def delete_user_roadmaps(
        self,
        db: AsyncSession,
        user_id: str,
    ):
        await db.execute(
            Roadmap.__table__.delete().where(Roadmap.user_id == user_id)
        )

    # ======================================================
    # WEEK
    # ======================================================

    async def create_week(
        self,
        db: AsyncSession,
        week: RoadmapWeek,
    ) -> RoadmapWeek:
        db.add(week)
        await db.flush()
        return week

    async def get_current_week(
        self,
        db: AsyncSession,
        roadmap_id: int,
    ) -> Optional[RoadmapWeek]:
        result = await db.execute(
            select(RoadmapWeek)
            .where(RoadmapWeek.roadmap_id == roadmap_id, RoadmapWeek.completion < 100)
            .order_by(RoadmapWeek.week_number.asc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    # ======================================================
    # TASK
    # ======================================================

    async def create_task(
        self,
        db: AsyncSession,
        task: RoadmapTask,
    ) -> RoadmapTask:
        db.add(task)
        await db.flush()
        return task

    async def get_task(
        self,
        db: AsyncSession,
        task_id: int,
    ) -> Optional[RoadmapTask]:
        result = await db.execute(
            select(RoadmapTask).where(RoadmapTask.id == task_id).limit(1)
        )
        return result.scalar_one_or_none()

    async def get_today_task(
        self,
        db: AsyncSession,
        roadmap_id: int,
    ) -> Optional[RoadmapTask]:
        result = await db.execute(
            select(RoadmapWeek)
            .options(joinedload(RoadmapWeek.tasks))
            .where(RoadmapWeek.roadmap_id == roadmap_id)
            .order_by(RoadmapWeek.week_number)
        )
        weeks = result.scalars().all()

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
            completed_tasks += len([
                task for task in week.tasks if task.completed
            ])

        if total_tasks == 0:
            return 0

        return int(completed_tasks / total_tasks * 100)

    def update_progress(
        self,
        db: AsyncSession,
        roadmap: Roadmap,
    ):
        roadmap.progress = self.calculate_progress(roadmap)

        for week in roadmap.weeks:
            total = len(week.tasks)
            if total == 0:
                week.completion = 0
                continue

            completed = len([
                task for task in week.tasks if task.completed
            ])
            week.completion = int(completed / total * 100)

        db.commit()

        db.refresh(roadmap)

        return roadmap

    # ======================================================
    # SAVE
    # ======================================================

    async def commit(
        self,
        db: AsyncSession,
    ):
        await db.commit()

    async def rollback(
        self,
        db: AsyncSession,
    ):
        await db.rollback()

    async def refresh(
        self,
        db: AsyncSession,
        obj,
    ):
        await db.refresh(obj)


roadmap_repository = RoadmapRepository()