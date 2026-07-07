from pydantic import BaseModel, Field, HttpUrl
from typing import Optional


class ProfileUpdateRequest(BaseModel):
    avatar: Optional[str] = ""
    bio: Optional[str] = Field(default="", max_length=500)
    college: Optional[str] = ""
    branch: Optional[str] = ""
    graduation_year: Optional[int] = 2027
    target_company: Optional[str] = ""
    target_package: Optional[str] = ""
    github: Optional[HttpUrl] = None
    linkedin: Optional[HttpUrl] = None


class ProfileResponse(BaseModel):
    full_name: str
    email: str

    avatar: str
    bio: str

    college: str
    branch: str
    graduation_year: int

    target_company: str
    target_package: str

    github: Optional[str]
    linkedin: Optional[str]

    model_config = {
        "from_attributes": True
    }