from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user
from app.models.user import User

from .schemas import (
    CodeReviewRequest,
)

from .service import (
    code_review_service,
)

router = APIRouter(
    prefix="/code-review",
    tags=["AI Code Review"],
)


@router.post("/review")
async def review(
    request: CodeReviewRequest,
    current_user: User = Depends(get_current_user),
):
    return await code_review_service.review(
        request.language,
        request.source_code,
        request.problem_statement,
    )
