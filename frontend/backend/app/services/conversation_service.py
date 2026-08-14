from sqlalchemy.orm import Session

from app.repositories.conversation_repository import (
    ConversationRepository,
)

from app.repositories.message_repository import (
    MessageRepository,
)


class ConversationService:

    def __init__(self, db: Session):

        self.conversations = ConversationRepository(db)

        self.messages = MessageRepository(db)

    def new_chat(self):

        return self.conversations.create()

    def history(self):

        return self.conversations.list()

    def add_user_message(
        self,
        conversation_id: str,
        text: str,
    ):

        return self.messages.create(
            conversation_id,
            "user",
            text,
        )

    def add_ai_message(
        self,
        conversation_id: str,
        text: str,
    ):

        return self.messages.create(
            conversation_id,
            "assistant",
            text,
        )

    def get_messages(
        self,
        conversation_id: str,
    ):

        return self.messages.list(
            conversation_id,
        )