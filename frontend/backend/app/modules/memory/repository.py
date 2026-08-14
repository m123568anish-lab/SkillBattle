from sqlalchemy.orm import Session

from app.models.memory import Memory


class MemoryRepository:
    def get_memories_by_user(
        self,
        db: Session,
        user_id: str,
    ):
        return (
            db.query(Memory)
            .filter(Memory.user_id == user_id)
            .order_by(Memory.created_at.desc())
            .all()
        )

    def create_memory(
        self,
        db: Session,
        memory: Memory,
    ):
        db.add(memory)
        db.commit()
        db.refresh(memory)
        return memory


memory_repository = MemoryRepository()
