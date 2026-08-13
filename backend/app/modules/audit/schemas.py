from datetime import datetime

from pydantic import BaseModel


class AuditResponse(BaseModel):

    id: str

    user_id: str | None

    action: str

    module: str

    ip_address: str | None

    user_agent: str | None

    created_at: datetime

    class Config:

        from_attributes = True