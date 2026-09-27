from pydantic import BaseModel, Field
from typing import Optional


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    avatar: Optional[str] = ""
    bio: Optional[str] = Field(default="", max_length=500)
    college: Optional[str] = ""
    branch: Optional[str] = ""
    graduation_year: Optional[int] = 2027
    target_company: Optional[str] = ""
    target_package: Optional[str] = ""
    onboarding_preferences: dict = Field(default_factory=dict)
    github: Optional[str] = ""
    linkedin: Optional[str] = ""


class ProfileResponse(BaseModel):
    full_name: Optional[str] = ""
    email: Optional[str] = ""
    total_xp: int = 0
    level: int = 1

    avatar: Optional[str] = ""
    bio: Optional[str] = ""

    college: Optional[str] = ""
    branch: Optional[str] = ""
    graduation_year: Optional[int] = 2027

    target_company: Optional[str] = ""
    target_package: Optional[str] = ""
    onboarding_preferences: dict = Field(default_factory=dict)

    github: Optional[str] = ""
    linkedin: Optional[str] = ""
    onboarding_completed: bool = False

    model_config = {
        "from_attributes": True
    }


class VerifiedSkill(BaseModel):
    skill: str
    score: float
    attempts: int
    sources: list[str]
    verified: bool = True


class SkillActivity(BaseModel):
    source: str
    title: str
    score: float
    completed_at: Optional[str] = None


class SkillAchievement(BaseModel):
    title: str
    description: str
    earned_at: Optional[str] = None


class SkillProfileResponse(BaseModel):
    skills: list[VerifiedSkill] = Field(default_factory=list)
    practice_performance: list[SkillActivity] = Field(default_factory=list)
    battle_performance: list[SkillActivity] = Field(default_factory=list)
    assessment_performance: list[SkillActivity] = Field(default_factory=list)
    interview_results: list[SkillActivity] = Field(default_factory=list)
    achievements: list[SkillAchievement] = Field(default_factory=list)
