from sqlalchemy.orm import Session

from app.models.message import Message


class MessageRepository:

    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        conversation_id: str,
        role: str,
        content: str,
    ):

        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
        )

        self.db.add(message)

        self.db.commit()

        self.db.refresh(message)

        return message

    def list(
        self,
        conversation_id: str,
    ):

        return (
            self.db.query(Message)
            .filter(
                Message.conversation_id
                == conversation_id
            )
            .order_by(Message.created_at)
            .all()
        )