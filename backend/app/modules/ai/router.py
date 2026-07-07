from fastapi import APIRouter

from app.modules.ai.schemas import AIRequest, AIResponse, AICoachResponse
from app.modules.ai.service import ai_service

router = APIRouter(prefix="/ai", tags=["AI Coach"])


@router.get("/health")
async def health() -> dict[str, str]:
    return {"module": "ai", "status": "healthy"}


@router.post("/chat", response_model=AIResponse)
def chat(request: AIRequest):
    answer = ai_service.generate_response(request.prompt)
    return AIResponse(response=answer)


@router.get("/coach", response_model=AICoachResponse)
def coach():
    return AICoachResponse(
        study_plan=["DSA", "System Design"],
        weak_topics=["Graphs", "Concurrency"],
        coding_challenge="Solve two medium-level problems",
        motivation="Keep building steadily every day",
        company_strategy="Target product-based companies with strong DSA preparation",
        next_milestone="Complete one mock interview this week",
    )