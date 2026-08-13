from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class NotificationCreate(BaseModel):

    user_id: str

    title: str

    message: str

    notification_type: str = "system"


class NotificationResponse(BaseModel):

    id: str

    title: str

    message: str

    notification_type: str

    is_read: bool

    created_at: datetime

    class Config:

        from_attributes = True