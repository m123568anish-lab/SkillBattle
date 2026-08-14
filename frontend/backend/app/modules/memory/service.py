from sqlalchemy.orm import Session

from app.models.memory import Memory
from app.modules.memory.repository import memory_repository


class MemoryService:
    def build_context(
        self,
        db: Session,
        user_id: str,
    ):
        memories = memory_repository.get_memories_by_user(db, user_id)
        return [
            {
                "category": memory.category,
                "title": memory.title,
                "content": memory.content,
                "created_at": memory.created_at.isoformat(),
            }
            for memory in memories
        ]

    def save_memory(
        self,
        db: Session,
        user_id: str,
        category: str,
        title: str,
        content: str,
    ):
        memory = Memory(
            user_id=user_id,
            category=category,
            title=title,
            content=content,
        )
        return memory_repository.create_memory(db, memory)


memory_service = MemoryService()
