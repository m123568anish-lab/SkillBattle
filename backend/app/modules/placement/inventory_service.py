from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.placement_jobs import PlacementInventoryTarget
from app.models.question import Question
from app.modules.placement.job_service import placement_job_service


class PlacementInventoryService:
    @staticmethod
    async def count_approved_questions(
        db: AsyncSession,
        *,
        company: str = "",
        role: str = "",
        topic: str = "",
        difficulty: str = "",
        question_type: str = "",
    ) -> int:
        stmt = select(Question).where(Question.is_validated.is_(True), Question.is_active.is_(True))
        if company:
            stmt = stmt.where(Question.company.ilike(f"%{company}%"))
        if role:
            stmt = stmt.where(Question.role.ilike(f"%{role}%"))
        if topic:
            stmt = stmt.where(Question.topic.ilike(f"%{topic}%"))
        if difficulty:
            stmt = stmt.where(Question.difficulty.ilike(f"%{difficulty}%"))
        if question_type:
            stmt = stmt.where(Question.question_type.ilike(f"%{question_type}%"))
        result = await db.execute(stmt)
        return len(result.scalars().all())

    @staticmethod
    async def ensure_target_inventory(
        db: AsyncSession,
        target: PlacementInventoryTarget,
    ) -> dict:
        current_count = await PlacementInventoryService.count_approved_questions(
            db,
            company=target.company,
            role=target.role,
            topic=target.topic,
            difficulty=target.difficulty,
            question_type=target.question_type,
        )
        target.current_count = current_count
        missing = max(0, target.target_count - current_count)
        if missing > 0:
            for _ in range(missing):
                await placement_job_service.create_job(
                    db,
                    "question-generation",
                    {
                        "company": target.company,
                        "role": target.role,
                        "topic": target.topic,
                        "difficulty": target.difficulty,
                        "question_type": target.question_type,
                    },
                    idempotency_key=f"inventory:{target.company}:{target.role}:{target.topic}:{target.difficulty}:{target.question_type}:{_}",
                )
        await db.commit()
        return {"target": target.target_count, "current": current_count, "missing": missing, "enqueued": missing}


placement_inventory_service = PlacementInventoryService()
