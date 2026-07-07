from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.database.database import get_db

from .service import analytics_service
from fastapi import APIRouter

router = APIRouter(

    prefix="/analytics",

    tags=["Analytics"],

)
router = APIRouter(

    prefix="/analytics",

    tags=["Analytics"],

)


@router.get("/dashboard")
def dashboard(

    db: Session = Depends(get_db),

):

    return analytics_service.dashboard(db)