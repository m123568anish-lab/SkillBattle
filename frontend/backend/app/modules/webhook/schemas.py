from pydantic import BaseModel


class CreateWebhookRequest(BaseModel):

    url: str

    secret: str


class WebhookResponse(BaseModel):

    id: str

    url: str

    active: bool

    class Config:

        from_attributes = True