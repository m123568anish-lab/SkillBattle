"""
=========================================================
SkillBattle Placement Schemas
=========================================================
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class MCQOption(BaseModel):
    id: str
    text: str


class MCQQuestion(BaseModel):
    id: str
    topic: str  # DBMS, Operating Systems, Computer Networks, OOPs, Data Structures
    question: str
    options: List[MCQOption]
    code_snippet: Optional[str] = None


class MCQSubmission(BaseModel):
    question_id: str
    selected_option_id: str


class HybridBattleStartRequest(BaseModel):
    company_tag: Optional[str] = Field(default=None, description="Company filter (e.g. Amazon, TCS, Google)")
    difficulty: str = Field(default="medium", description="easy, medium, hard")


class HybridBattleResponse(BaseModel):
    battle_id: str
    title: str
    company_name: str
    time_limit_minutes: int
    mcqs: List[MCQQuestion]
    coding_challenge: Dict[str, Any]


class MCQEvaluateRequest(BaseModel):
    battle_id: str
    submissions: List[MCQSubmission]


class MCQEvaluateResponse(BaseModel):
    battle_id: str
    score: int
    total_mcqs: int
    correct_count: int
    details: List[Dict[str, Any]]


class CompanySpeedrunTrack(BaseModel):
    id: str
    company_name: str
    logo_symbol: str
    tier: str  # FAANG, Product, Service, Unicorn
    duration_minutes: int
    mcq_count: int
    coding_problem_count: int
    tags: List[str]
    description: str
    recommended_min_rating: int


class PlacementScorecardResponse(BaseModel):
    user_id: str
    overall_readiness_score: int  # 0 to 100
    grade: str  # S, A+, A, B, C
    dsa_proficiency: int
    system_design_grade: str
    core_cs_score: int
    total_battles_won: int
    top_company_eligibility: List[str]
    recommendations: List[str]
