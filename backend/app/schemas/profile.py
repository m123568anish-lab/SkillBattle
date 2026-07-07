from pydantic import BaseModel


class ProfileResponse(BaseModel):
    avatar: str
    full_name: str
    bio: str
    college: str
    branch: str
    graduation_year: int
    target_company: str
    target_package: str
    github: str
    linkedin: str

    model_config = {
        "from_attributes": True
    }


class ProfileUpdate(BaseModel):
    avatar: str = ""
    bio: str = ""
    college: str = ""
    branch: str = ""
    graduation_year: int = 2027
    target_company: str = ""
    target_package: str = ""
    github: str = ""
    linkedin: str = ""