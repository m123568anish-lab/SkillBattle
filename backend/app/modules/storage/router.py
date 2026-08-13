"""
=========================================================

SkillBattle

Storage Router

=========================================================
"""

from __future__ import annotations

from fastapi import (
    APIRouter,
    Depends,
    File,
    UploadFile,
)

from app.core.dependencies import (
    get_current_user,
)

from app.models.user import User

from app.modules.storage.schemas import (
    UploadResponse,
)

from app.modules.storage.service import (
    storage_service,
)

router = APIRouter(

    prefix="/storage",

    tags=["Storage"],

)


@router.get("/health")
async def health():

    return {

        "module": "storage",

        "status": "healthy",

    }


@router.post(

    "/upload",

    response_model=UploadResponse,

)

async def upload(

    file: UploadFile = File(...),

    current_user: User = Depends(

        get_current_user,

    ),

):

    return await storage_service.upload(

        file,

        folder="user",

    )


@router.delete("/delete")

async def delete(

    path: str,

    current_user: User = Depends(

        get_current_user,

    ),

):

    await storage_service.delete(

        path,

    )

    return {

        "message": "File deleted successfully."

    }