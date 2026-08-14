from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.profile import ProfileResponse, ProfileUpdate
from app.services.profile_service import get_profile, update_profile

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("", response_model=ProfileResponse)
def get_current_profile(db: Session = Depends(get_db)):
    return get_profile(db, "current-user")


@router.put("", response_model=ProfileResponse, status_code=status.HTTP_200_OK)
def update_current_profile(payload: ProfileUpdate, db: Session = Depends(get_db)):
    return update_profile(db, "current-user", payload)
