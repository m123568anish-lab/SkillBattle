from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.battle import BattleParticipant, BattleRoom
from app.models.question import Question
from app.models.quest_map import QuestMapLevel, QuestProgress
from app.models.user import User
from app.models.xp import XP
from app.modules.battle.question_engine import question_engine
from app.modules.battle.schemas import CreateBattleRequest
from app.modules.battle.service import battle_service
from app.modules.quest_map.catalog import MAP_ID, get_level_catalog
from app.modules.quest_map.scoring import stars_for_accuracy


class QuestMapService:
    async def ensure_catalog(self, db: AsyncSession) -> list[QuestMapLevel]:
        definitions = get_level_catalog()
        rows: list[QuestMapLevel] = []
        changed = False
        for definition in definitions:
            row = await db.get(QuestMapLevel, definition["id"])
            if row is None:
                row = QuestMapLevel(id=definition["id"], **{key: value for key, value in definition.items() if key != "id"})
                db.add(row)
                changed = True
            else:
                for key, value in definition.items():
                    if key != "id" and getattr(row, key) != value:
                        setattr(row, key, value)
                        changed = True
            rows.append(row)
        if changed:
            try:
                await db.commit()
            except IntegrityError:
                await db.rollback()
                rows = list((await db.scalars(
                    select(QuestMapLevel).where(QuestMapLevel.map_id == MAP_ID).order_by(QuestMapLevel.sequence)
                )).all())
        return rows

    @staticmethod
    def _inventory_counts(level: QuestMapLevel, questions: list[Question]) -> tuple[int, int]:
        required = 0
        available = 0
        for section in level.battle_configuration.get("sections", []):
            question_type = str(section.get("question_type", "coding")).casefold()
            category = str(section.get("skill_category") or "").strip().casefold()
            count = int(section.get("question_count", 1))
            required += count
            available += sum(
                1
                for question in questions
                if (question.question_type or "").casefold() == question_type
                and (not category or (question.skill_category or "").strip().casefold() == category)
            )
        return required, available

    async def get_map(self, db: AsyncSession, user: User, map_id: str = MAP_ID) -> dict[str, Any]:
        if map_id != MAP_ID:
            raise ValueError("Quest Map not found.")
        levels = await self.ensure_catalog(db)
        progress_rows = list((await db.scalars(
            select(QuestProgress).where(QuestProgress.user_id == user.id)
        )).all())
        progress_by_level = {row.level_id: row for row in progress_rows}
        question_rows = list((await db.scalars(
            select(Question).where(Question.is_active.is_(True), Question.is_validated.is_(True))
        )).all())
        eligible_questions = [question for question in question_rows if question_engine._is_adaptively_eligible(question)]
        xp_row = await db.scalar(select(XP).where(XP.user_id == user.id))
        views = []

        for level in levels:
            progress = progress_by_level.get(level.id)
            prerequisites = level.prerequisite_level_ids or []
            incomplete = [
                prerequisite_id
                for prerequisite_id in prerequisites
                if progress_by_level.get(prerequisite_id) is None
                or progress_by_level[prerequisite_id].status not in {"COMPLETED", "MASTERED"}
            ]
            by_id = {candidate.id: candidate for candidate in levels}
            required, available = self._inventory_counts(level, eligible_questions)

            if progress and progress.status in {"COMPLETED", "MASTERED"}:
                status = progress.status
            elif progress and progress.status == "IN_PROGRESS":
                status = "IN_PROGRESS"
            else:
                status = "LOCKED" if incomplete else "AVAILABLE"

            views.append({
                "id": level.id,
                "map_id": level.map_id,
                "sequence": level.sequence,
                "title": level.title,
                "description": level.description,
                "type": level.level_type,
                "skill_category": level.skill_category,
                "battle_configuration": level.battle_configuration,
                "prerequisite_level_ids": prerequisites,
                "prerequisite_titles": [by_id[key].title for key in incomplete if key in by_id],
                "required_question_count": required,
                "available_question_count": available,
                "difficulty": level.battle_configuration.get("difficulty", "medium"),
                "duration_minutes": level.battle_configuration.get("duration_minutes", 12),
                "is_milestone": level.is_milestone,
                "status": status,
                "can_start": status == "AVAILABLE" and available >= required,
                "unavailable_reason": (
                    f"Requires {required} validated questions; {available} are available."
                    if status == "AVAILABLE" and available < required
                    else f"Complete: {', '.join(by_id[key].title for key in incomplete if key in by_id)}."
                    if status == "LOCKED"
                    else None
                ),
                "stars": progress.stars if progress else 0,
                "best_accuracy": progress.best_accuracy if progress else None,
                "attempts": progress.attempts if progress else 0,
                "battle_id": progress.battle_id if progress and status == "IN_PROGRESS" else None,
            })

        completed_count = sum(level["status"] in {"COMPLETED", "MASTERED"} for level in views)
        return {
            "map_id": MAP_ID,
            "title": "Placement Journey",
            "completed_levels": completed_count,
            "total_levels": len(views),
            "total_xp": xp_row.total_xp if xp_row else 0,
            "levels": views,
        }

    async def start_level(self, db: AsyncSession, user: User, level_id: str) -> dict[str, str]:
        levels = await self.ensure_catalog(db)
        level_by_id = {level.id: level for level in levels}
        level = level_by_id.get(level_id)
        if level is None or not level.is_active:
            raise ValueError("Quest level not found.")

        progress = await db.scalar(select(QuestProgress).where(
            QuestProgress.user_id == user.id,
            QuestProgress.level_id == level.id,
        ).with_for_update())
        if progress and progress.status in {"COMPLETED", "MASTERED"}:
            raise ValueError("This quest level is already complete.")

        prerequisites = level.prerequisite_level_ids or []
        if prerequisites:
            completed_ids = set((await db.scalars(
                select(QuestProgress.level_id).where(
                    QuestProgress.user_id == user.id,
                    QuestProgress.level_id.in_(prerequisites),
                    QuestProgress.status.in_(["COMPLETED", "MASTERED"]),
                )
            )).all())
            incomplete = [level_by_id[key].title for key in prerequisites if key not in completed_ids]
            if incomplete:
                raise ValueError(f"Locked. Complete: {', '.join(incomplete)}.")

        if progress and progress.status == "IN_PROGRESS" and progress.battle_id:
            existing_battle = await db.get(BattleRoom, progress.battle_id)
            participants = (await db.scalars(select(BattleParticipant).where(
                BattleParticipant.battle_id == progress.battle_id,
                BattleParticipant.user_id == user.id,
            ))).first()
            snapshot = [
                question
                for section in (existing_battle.questions_data or []) if isinstance(section, dict)
                for question in section.get("questions", []) if isinstance(question, dict) and question.get("id")
            ] if existing_battle else []
            if existing_battle and existing_battle.status == "running" and participants and snapshot:
                return {"battle_id": existing_battle.id, "status": "IN_PROGRESS"}
            progress.status = "AVAILABLE"
            progress.battle_id = None
            await db.flush()

        configuration = level.battle_configuration
        battle_request = CreateBattleRequest(
            title=level.title,
            difficulty=configuration.get("difficulty", "medium"),
            battle_type=configuration.get("battle_type", "practice"),
            max_players=1,
        )
        battle = await battle_service.create_battle(
            db,
            user,
            battle_request,
            sections_override=configuration.get("sections", []),
            start_immediately=True,
            commit=False,
        )
        if progress is None:
            progress = QuestProgress(user_id=user.id, level_id=level.id)
            db.add(progress)
        progress.status = "IN_PROGRESS"
        progress.battle_id = battle.id
        progress.attempts = (progress.attempts or 0) + 1
        progress.updated_at = datetime.utcnow()
        await db.commit()
        return {"battle_id": battle.id, "status": "IN_PROGRESS"}


quest_map_service = QuestMapService()