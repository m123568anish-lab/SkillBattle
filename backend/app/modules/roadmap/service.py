import json
from datetime import datetime

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.roadmap import Roadmap, RoadmapTask, RoadmapWeek
from app.models.user import User
from app.modules.profile.service import profile_service
from app.modules.roadmap.builder import RoadmapPromptBuilder
from app.modules.roadmap.repository import roadmap_repository
from app.modules.roadmap.schemas import AIRoadmap
from app.modules.xp.service import xp_service


class RoadmapService:
    """Business logic for AI-generated roadmaps."""

    async def generate_ai_roadmap(self, db: AsyncSession, current_user: User, duration: int) -> AIRoadmap:
        profile = await profile_service.get_profile(db, current_user)

        prompt = RoadmapPromptBuilder.build(
            profile={
                "name": current_user.full_name,
                "college": profile.college,
            },
            xp={"level": 1, "total_xp": 0},
            streak={"current_streak": 0},
            goals=[],
            companies=[],
            languages=[],
            memory="",
            duration=duration,
        )

        try:
            response = "{}"
            roadmap_json = json.loads(response)
            return AIRoadmap.model_validate(roadmap_json)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid JSON returned by AI service.\n{exc}") from exc
        except ValidationError as exc:
            raise ValueError(f"Roadmap validation failed.\n{exc}") from exc

    async def save_roadmap(self, db: AsyncSession, current_user: User, roadmap_data: AIRoadmap) -> Roadmap:
        await roadmap_repository.delete_user_roadmaps(db, current_user.id)

        roadmap = Roadmap(
            user_id=current_user.id,
            title=roadmap_data.title,
            target_company="",
            duration_weeks=roadmap_data.duration_weeks,
            estimated_hours=roadmap_data.estimated_hours,
            progress=0,
            status="ACTIVE",
        )
        roadmap = await roadmap_repository.create_roadmap(db, roadmap)

        for week_data in roadmap_data.weeks:
            week = RoadmapWeek(
                roadmap_id=roadmap.id,
                week_number=week_data.week_number,
                title=week_data.title,
                objective=week_data.objective,
                completion=0,
            )
            week = await roadmap_repository.create_week(db, week)

            for task_data in week_data.tasks:
                task = RoadmapTask(
                    week_id=week.id,
                    day=task_data.day,
                    topic=task_data.topic,
                    difficulty=task_data.difficulty,
                    estimated_minutes=task_data.estimated_minutes,
                    reward_xp=task_data.reward_xp,
                    completed=False,
                )
                await roadmap_repository.create_task(db, task)

        await db.commit()
        await db.refresh(roadmap)
        return roadmap

    async def generate(self, db: AsyncSession, current_user: User, duration: int) -> Roadmap:
        roadmap_json = await self.generate_ai_roadmap(db, current_user, duration)
        return await self.save_roadmap(db, current_user, roadmap_json)

    async def get_roadmap(self, db: AsyncSession, current_user: User) -> Roadmap | None:
        return await roadmap_repository.get_active_roadmap(db, current_user.id)

    async def get_current_week(self, db: AsyncSession, current_user: User):
        roadmap = await self.get_roadmap(db, current_user)
        if roadmap is None:
            return None
        return await roadmap_repository.get_current_week(db, roadmap.id)

    async def get_today_task(self, db: AsyncSession, current_user: User):
        roadmap = await self.get_roadmap(db, current_user)
        if roadmap is None:
            return None
        return await roadmap_repository.get_today_task(db, roadmap.id)

    async def get_progress(self, db: AsyncSession, current_user: User):
        roadmap = await self.get_roadmap(db, current_user)
        if roadmap is None:
            return {"progress": 0, "completed": 0, "remaining": 0}

        total_tasks = 0
        completed_tasks = 0
        for week in roadmap.weeks:
            total_tasks += len(week.tasks)
            completed_tasks += len([task for task in week.tasks if task.completed])

        return {
            "progress": roadmap.progress,
            "completed": completed_tasks,
            "remaining": total_tasks - completed_tasks,
        }

    async def complete_task(self, db: AsyncSession, current_user: User, task_id: int):
        task = await roadmap_repository.get_task(db, task_id)
        if task is None:
            raise HTTPException(status_code=404, detail="Task not found")
        if task.completed:
            raise HTTPException(status_code=400, detail="Task already completed")

        task.completed = True
        task.completed_at = datetime.utcnow()
        await db.commit()

        roadmap = await self.get_roadmap(db, current_user)
        if roadmap is not None:
            roadmap.progress = self.calculate_progress(roadmap)
            for week in roadmap.weeks:
                total = len(week.tasks)
                week.completion = 0 if total == 0 else int(sum(1 for task in week.tasks if task.completed) / total * 100)
            await db.commit()

        try:
            await xp_service.add_xp(db, current_user, task.reward_xp)
        except Exception:
            pass

        progress = await self.get_progress(db, current_user)
        return {
            "task_id": task.id,
            "topic": task.topic,
            "reward_xp": task.reward_xp,
            "progress": progress,
            "message": "Task completed successfully.",
        }

    def calculate_progress(self, roadmap: Roadmap) -> int:
        total_tasks = 0
        completed_tasks = 0
        for week in roadmap.weeks:
            total_tasks += len(week.tasks)
            completed_tasks += len([task for task in week.tasks if task.completed])
        if total_tasks == 0:
            return 0
        return int(completed_tasks / total_tasks * 100)


roadmap_service = RoadmapService()