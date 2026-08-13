from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db

from app.modules.audit.repository import (
    audit_repository,
)

router = APIRouter(

    prefix="/audit",

    tags=["Audit"],

)


@router.get("/health")

async def health():

    return {

        "status": "healthy",

        "module": "audit",

    }


@router.get("")

async def logs(

    db: AsyncSession = Depends(

        get_db,

    ),

):

    return await audit_repository.list(

        db,

    )