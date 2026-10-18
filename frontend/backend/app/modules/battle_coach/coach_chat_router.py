"""
=========================================================
SkillBattle - Placement-Focused AI Coach Chat Router
=========================================================
"""
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.dependencies import get_current_user
from app.models.user import User
from app.modules.ai.provider import ai_provider

router = APIRouter(prefix="/coach", tags=["AI Coach Chat"])
logger = logging.getLogger(__name__)


class ChatRequest(BaseModel):
    message: str


@router.post("/chat")
async def chat(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        reply = await ai_provider.generate(
            "You are SkillBattle's AI Coach. Answer the student's question accurately. "
            "Do not invent user metrics or employer hiring processes.\n\n"
            f"Student: {current_user.full_name or current_user.username}\n"
            f"Question: {req.message}"
        )
    except Exception as err:
        logger.exception("AI Coach provider is unavailable")
        raise HTTPException(
            status_code=503,
            detail="AI Coach is currently unavailable because no working AI provider responded.",
        ) from err

    if not reply or not reply.strip():
        raise HTTPException(status_code=503, detail="AI Coach returned an empty response.")
    return {"reply": reply, "user": current_user.username}
