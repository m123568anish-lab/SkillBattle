from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.core.security.permissions import require_resource_ownership
from app.models.user import User

from .schemas import RecruiterReportRequest
from .service import recruiter_service

router = APIRouter(
    prefix="/recruiter",
    tags=["AI Recruiter"],
)


@router.get("/health")
async def health() -> dict[str, str]:
    return {"module": "recruiter", "status": "healthy"}


@router.post("/report")
async def generate_report(
    request: RecruiterReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Enforce BOLA / IDOR protection: only the owner or an admin / recruiter can request the report
    user_role = str(getattr(current_user, "role", "") or "").strip().upper()
    is_recruiter_or_admin = (
        getattr(current_user, "is_superuser", False)
        or user_role in {"ADMIN", "PLATFORM_ADMIN", "RECRUITER", "COMPANY_ADMIN"}
    )
    if not is_recruiter_or_admin and str(current_user.id) != str(request.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: you can only generate reports for your own account.",
        )

    return await recruiter_service.generate_report(
        db,
        request.user_id,
    )
