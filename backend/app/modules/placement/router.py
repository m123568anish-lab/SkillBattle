"""
=========================================================
SkillBattle Placement Router
=========================================================
"""

from typing import List, Optional
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_current_user
from app.models.user import User
from app.modules.placement.schemas import (
    CompanySpeedrunTrack,
    HybridBattleStartRequest,
    HybridBattleResponse,
    MCQEvaluateRequest,
    MCQEvaluateResponse,
    PlacementScorecardResponse,
)
from app.modules.placement.service import placement_service

router = APIRouter(
    prefix="/placement",
    tags=["Placement & Career Readiness"],
)


@router.get("/company-tracks", response_model=List[CompanySpeedrunTrack])
async def get_company_tracks():
    """Return available company-specific placement speedrun tracks."""
    return placement_service.get_company_tracks()


@router.post("/hybrid-battle/start", response_model=HybridBattleResponse)
async def start_hybrid_battle(
    request: HybridBattleStartRequest,
    current_user: User = Depends(get_current_user),
):
    """Start a placement hybrid battle (MCQ Round + Coding Challenge)."""
    battle_id = f"placement_{uuid4().hex[:8]}"
    mcqs = placement_service.get_hybrid_mcqs(5)

    coding_challenge = {
        "id": "chal_two_sum_placement",
        "title": "Optimal Subarray Target Sum",
        "difficulty": request.difficulty,
        "company_tag": request.company_tag or "Amazon",
        "description": "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
        "input_format": "Array nums, Target int",
        "output_format": "Array of 2 indices [i, j]",
        "starter_code": {
            "python": "def two_sum(nums: list[int], target: int) -> list[int]:\n    # Write your optimal code here\n    pass\n",
            "cpp": "#include <vector>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    // Write your optimal code here\n    return {};\n}\n",
            "java": "import java.util.*;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your optimal code here\n        return new int[]{};\n    }\n}\n"
        }
    }

    return HybridBattleResponse(
        battle_id=battle_id,
        title=f"{request.company_tag or 'Placement'} Assessment Speedrun",
        company_name=request.company_tag or "Amazon",
        time_limit_minutes=45,
        mcqs=mcqs,
        coding_challenge=coding_challenge,
    )


@router.post("/hybrid-battle/evaluate-mcq", response_model=MCQEvaluateResponse)
async def evaluate_hybrid_mcq(
    request: MCQEvaluateRequest,
    current_user: User = Depends(get_current_user),
):
    """Evaluate MCQ responses in a placement hybrid battle."""
    return placement_service.evaluate_mcqs(request.battle_id, request.submissions)


@router.get("/scorecard", response_model=PlacementScorecardResponse)
async def get_placement_scorecard(
    current_user: User = Depends(get_current_user),
):
    """Generate and return the student's Placement Readiness Scorecard."""
    return placement_service.generate_scorecard(
        user_id=current_user.id,
        total_xp=getattr(current_user, "total_xp", 1500) or 1500,
        rating=getattr(current_user, "coding_rating", 1350) or 1350,
        battles_won=14,
    )
