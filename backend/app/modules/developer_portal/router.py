from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.security import get_current_user

from app.models.user import User

from .service import (
    developer_portal_service,
)

router = APIRouter(

    prefix="/developer-portal",

    tags=["Developer Portal"],

)


@router.get("/health")
async def health() -> dict[str, str]:
    return {"module": "developer_portal", "status": "healthy"}


@router.get("/playground")

def playground():

    return {

        "swagger":

        "/docs",

        "redoc":

        "/redoc",

    }
@router.get("/dashboard")
def dashboard(

    db: Session = Depends(get_db),

    current_user: User = Depends(

        get_current_user

    ),

):

    return developer_portal_service.dashboard(

        db,

        current_user,

    )