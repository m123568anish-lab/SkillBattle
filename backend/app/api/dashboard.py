from fastapi import APIRouter

from app.schemas.dashboard import DashboardResponse

from app.services.dashboard_service import (
    get_dashboard,
)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get(
    "",
    response_model=DashboardResponse,
)
def dashboard():

    return get_dashboard()