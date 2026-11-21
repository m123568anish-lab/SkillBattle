from pydantic import BaseModel, field_validator
from app.core.security.ssrf import validate_url_for_ssrf


class CreateWebhookRequest(BaseModel):

    url: str
    secret: str

    @field_validator("url")
    @classmethod
    def validate_destination_url(cls, v: str) -> str:
        if not validate_url_for_ssrf(v):
            raise ValueError("Target webhook URL cannot point to loopback, private networks, or cloud metadata endpoints.")
        return v


class WebhookResponse(BaseModel):

    id: str
    url: str
    active: bool

    class Config:
        from_attributes = True
