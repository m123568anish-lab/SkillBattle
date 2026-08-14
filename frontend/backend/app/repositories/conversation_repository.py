from sqlalchemy.orm import Session

from app.models.conversation import Conversation


class ConversationRepository:

    def __init__(self, db: Session):
        self.db = db

    def create(self):

        conversation = Conversation()

        self.db.add(conversation)

        self.db.commit()

        self.db.refresh(conversation)

        return conversation

    def get(self, conversation_id: str):

        return (
            self.db.query(Conversation)
            .filter(
                Conversation.id == conversation_id
            )
            .first()
        )

    def list(self):

        return (
            self.db.query(Conversation)
            .order_by(
                Conversation.created_at.desc()
            )
            .all()
        )

    def delete(self, conversation):

        self.db.delete(conversation)

        self.db.commit()