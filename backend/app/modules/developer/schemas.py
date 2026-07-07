from datetime import datetime

from pydantic import BaseModel


class CreateApiKeyRequest(BaseModel):

    name: str


class ApiKeyResponse(BaseModel):

    id: str

    name: str

    api_key: str

    active: bool

    created_at: datetime

    class Config:

        from_attributes = True