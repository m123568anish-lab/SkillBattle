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

    model_config = {
        "from_attributes": True
    }
