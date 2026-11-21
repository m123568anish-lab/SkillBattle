"""
=========================================================

SkillBattle / Qubira
Storage Router — Secure File Upload & Deletion with
Magic Bytes Validation, Path Traversal Defense & BOLA Protection.

=========================================================
"""

from __future__ import annotations

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)

from app.core.dependencies import (
    get_current_user,
)
from app.core.security.file_upload import (
    safe_storage_path,
    validate_document_file,
    validate_image_file,
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
    current_user: User = Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file selected for upload.",
        )

    # Read content to validate real magic numbers and prevent spoofed uploads
    content = await file.read()
    await file.seek(0)

    # Validate against allowed image or document file types
    is_image = False
    is_doc = False

    try:
        validate_image_file(content, file.filename)
        is_image = True
    except HTTPException:
        try:
            validate_document_file(content, file.filename)
            is_doc = True
        except HTTPException:
            pass

    if not is_image and not is_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported or potentially dangerous file format. Allowed: JPEG, PNG, WebP, GIF, PDF, DOCX.",
        )

    # User-isolated storage folder
    user_folder = f"users/{current_user.id}"
    return await storage_service.upload(
        file,
        folder=user_folder,
    )


@router.delete("/delete")
async def delete(
    path: str,
    current_user: User = Depends(get_current_user),
):
    # 1. Defend against path traversal (../, absolute paths, null bytes)
    try:
        sanitized_path = safe_storage_path(path)
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file path.",
        )

    # 2. Enforce BOLA / IDOR ownership
    user_role = str(getattr(current_user, "role", "") or "").strip().upper()
    is_admin = getattr(current_user, "is_superuser", False) or user_role in {"ADMIN", "PLATFORM_ADMIN"}

    # If the path is under a user folder, verify ownership
    if sanitized_path.startswith("users/"):
        path_segments = sanitized_path.split("/")
        if len(path_segments) >= 2:
            owner_id = path_segments[1]
            if not is_admin and str(current_user.id) != owner_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: you do not have permission to delete this file.",
                )
    elif not is_admin:
        # Non-admins cannot delete files outside user directory
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: administrative permissions required to delete general files.",
        )

    await storage_service.delete(sanitized_path)

    return {
        "message": "File deleted successfully.",
    }
