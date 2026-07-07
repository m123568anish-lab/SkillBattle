from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.security import get_current_user

from app.models.user import User
from app.middleware.api_auth import verify_api_key
from .schemas import CreateApiKeyRequest
from .service import developer_service

router = APIRouter(

    prefix="/developer",

    tags=["Developer API"],

)


@router.post("/keys")
def create_key(

    request: CreateApiKeyRequest,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user),

):

    return developer_service.create_key(

        db,

        current_user,

        request.name,

    )


@router.get("/keys")
def list_keys(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    api_key=Depends(verify_api_key),
):

    return developer_service.list_keys(
        db,
        current_user,
    )