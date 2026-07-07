from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.database.session import get_db

from app.schemas.conversation import (
    ConversationCreate,
    ConversationUpdate,
    ConversationResponse,
    MessageResponse,
)

from app.services.conversation_service import (
    ConversationService,
)

router = APIRouter(
    prefix="/conversations",
    tags=["Conversations"],
)
@router.post(
    "",
    response_model=ConversationResponse,
)
def create_conversation(
    request: ConversationCreate,
    db: Session = Depends(get_db),
):

    service = ConversationService(db)

    conversation = service.new_chat()

    if request.title:

        conversation.title = request.title

        db.commit()

        db.refresh(conversation)

    return conversation
@router.get(
    "",
    response_model=list[ConversationResponse],
)
def list_conversations(
    db: Session = Depends(get_db),
):

    service = ConversationService(db)

    return service.history()
@router.get(
    "/{conversation_id}",
    response_model=list[MessageResponse],
)
def conversation_messages(
    conversation_id: str,
    db: Session = Depends(get_db),
):

    service = ConversationService(db)

    return service.get_messages(
        conversation_id,
    )@router.patch(
    "/{conversation_id}",
    response_model=ConversationResponse,
)
def rename_conversation(
    conversation_id: str,
    request: ConversationUpdate,
    db: Session = Depends(get_db),
):

    service = ConversationService(db)

    conversation = service.conversations.get(
        conversation_id,
    )

    if not conversation:

        raise HTTPException(
            404,
            "Conversation not found",
        )

    conversation.title = request.title

    db.commit()

    db.refresh(conversation)

    return conversation
@router.delete(
    "/{conversation_id}",
)
def delete_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
):

    service = ConversationService(db)

    conversation = service.conversations.get(
        conversation_id,
    )

    if not conversation:

        raise HTTPException(
            404,
            "Conversation not found",
        )

    service.conversations.delete(
        conversation,
    )

    return {
        "message": "Conversation deleted",
    }