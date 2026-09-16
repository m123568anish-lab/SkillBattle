"""
Friend module schemas.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

class AddFriendRequest(BaseModel):
    """Payload to add a friend by user ID."""
    friend_id: str = Field(..., description="User ID of the friend to add")

class FriendResponse(BaseModel):
    """Simple friend information returned by the API."""
    user_id: str = Field(..., description="User ID of the friend")
    username: str = Field(..., description="Username of the friend")
    full_name: str = Field(..., description="Display name of the friend")
    avatar_url: str | None = Field(default=None, description="Avatar URL of the friend")
    created_at: str = Field(..., description="Timestamp when the friendship was created")

class FriendListResponse(BaseModel):
    friends: list[FriendResponse] = Field(..., description="List of friends for the current user")
