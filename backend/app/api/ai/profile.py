from fastapi import APIRouter

from app.schemas.profile import ProfileResponse

from app.services.profile_service import get_profile

router = APIRouter(
    prefix="/profile",
    tags=["Profile"],
)


@router.get(
    "",
    response_model=ProfileResponse,
)
def profile():

    return get_profile()