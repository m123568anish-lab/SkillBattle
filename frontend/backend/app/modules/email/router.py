"""
=========================================================

SkillBattle

Email Router

=========================================================
"""

from __future__ import annotations

from fastapi import (
    APIRouter,
    Depends,
)

from app.core.dependencies import (
    get_current_user,
)

from app.models.user import User

from app.modules.email.schemas import (
    EmailRequest,
)

from app.modules.email.service import (
    email_service,
)

router = APIRouter(

    prefix="/email",

    tags=["Email"],

)


@router.get("/health")
async def health():

    return {

        "module": "email",

        "status": "healthy",

    }


@router.post("/send")
async def send_email(

    request: EmailRequest,

    current_user: User = Depends(

        get_current_user,

    ),

):

    await email_service.send_email(

        request.recipient,

        request.subject,

        request.body,

    )

    return {

        "message": "Email sent successfully."

    }


@router.post("/welcome")
async def welcome(

    current_user: User = Depends(

        get_current_user,

    ),

):

    await email_service.send_welcome_email(

        current_user.email,

        current_user.full_name,

    )

    return {

        "message": "Welcome email sent."

    }