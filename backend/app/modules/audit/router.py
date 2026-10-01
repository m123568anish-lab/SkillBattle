from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_admin, get_current_user
from app.database.session import get_db
from app.models.user import User
from app.models.college import College
from app.models.company import CompanyMember
from app.modules.audit.repository import audit_repository
from sqlalchemy import select

router = APIRouter(prefix="/audit", tags=["Activity"])


class ActivityEntry(BaseModel):
    id: str
    user_id: str | None
    action: str
    module: str
    organization_type: str | None
    organization_id: str | None
    entity_type: str | None
    entity_id: str | None
    metadata_json: dict
    created_at: datetime


@router.get("/me", response_model=list[ActivityEntry])
async def get_my_activity(
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await audit_repository.list_for_user(db, current_user.id, limit=limit)


@router.get("", response_model=list[ActivityEntry])
async def get_organization_activity(
    limit: int = Query(default=100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return await audit_repository.list(db, limit=limit)


@router.get("/organization", response_model=list[ActivityEntry])
async def get_my_organization_activity(
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = (current_user.role or "").lower()
    if role == "college_admin":
        college_id = await db.scalar(
            select(College.id).where(College.admin_user_id == current_user.id)
        )
        if college_id is None:
            raise HTTPException(status_code=403, detail="College administrator membership required.")
        return await audit_repository.list_for_organization(
            db, "college", college_id, limit=limit
        )

    if role in {"company_admin", "hiring_manager"}:
        company_id = await db.scalar(
            select(CompanyMember.company_id).where(
                CompanyMember.user_id == current_user.id,
                CompanyMember.status == "active",
                CompanyMember.role.in_(["company_admin", "hiring_manager"]),
            )
        )
        if company_id is None:
            raise HTTPException(status_code=403, detail="Company administrator membership required.")
        return await audit_repository.list_for_organization(
            db, "company", company_id, limit=limit
        )

    raise HTTPException(status_code=403, detail="Organization audit access denied.")