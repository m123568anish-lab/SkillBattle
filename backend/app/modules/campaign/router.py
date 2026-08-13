from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from .schemas import (
    CampaignStatusResponse,
    CampaignLevelResponse,
    LevelSubmitRequest,
    LevelSubmitResponse
)
from .service import campaign_service

router = APIRouter(
    prefix="/campaign",
    tags=["Campaign Mode"],
)

@router.get("/status", response_model=CampaignStatusResponse)
async def get_campaign_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await campaign_service.get_status(db, current_user.id)

@router.get("/level/{track}/{level_id}", response_model=CampaignLevelResponse)
async def get_campaign_level(
    track: str,
    level_id: int,
    current_user: User = Depends(get_current_user)
):
    try:
        return campaign_service.get_level(track, level_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.post("/submit", response_model=LevelSubmitResponse)
async def submit_campaign_level(
    req: LevelSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return await campaign_service.submit_level(db, current_user.id, req)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
