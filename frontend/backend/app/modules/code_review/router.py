from fastapi import APIRouter

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

):

    return await code_review_service.review(

        request.language,

        request.source_code,

        request.problem_statement,

    )