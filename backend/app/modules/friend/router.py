"""
Friend module router – expose endpoints to list friends and add a new friend.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.dependencies import get_current_user

from app.models.user import User
from app.modules.auth.services.auth_service import auth_service

from .schemas import AddFriendRequest, FriendListResponse, FriendResponse
from .service import friend_service

router = APIRouter(
    prefix="/friend",
    tags=["Friend"],
)

@router.get("/", response_model=FriendListResponse)
async def list_friends(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the current user's friends list."""
    friendships = await friend_service.get_friends(db, current_user)
    friends = []
    for f in friendships:
        friend_id = f.friend_id if f.user_id == current_user.id else f.user_id
        friend = f.friend if f.user_id == current_user.id else f.user
        friends.append(
            FriendResponse(
                user_id=friend_id,
                username=friend.username,
                full_name=friend.full_name,
                avatar_url=friend.avatar_url,
                created_at=str(f.created_at),
            )
        )
    return FriendListResponse(friends=friends)

@router.post("/", response_model=FriendResponse, status_code=status.HTTP_201_CREATED)
async def add_friend(
    request: AddFriendRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a friendship between the current user and the provided friend ID."""
    # Validate that the friend exists
    friend_user = await auth_service.get_user_by_id(db, request.friend_id)
    if not friend_user:
        raise HTTPException(status_code=404, detail="Friend user not found")
    friendship = await friend_service.add_friend(db, current_user, friend_user)
    if friendship is None:
        raise HTTPException(status_code=400, detail="Friendship already exists")
    return FriendResponse(
        user_id=friend_user.id,
        username=friend_user.username,
        full_name=friend_user.full_name,
        avatar_url=friend_user.avatar_url,
        created_at=str(friendship.created_at),
    )


@router.delete("/{friend_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_friend(
    friend_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove an existing friendship."""
    friend_user = await auth_service.get_user_by_id(db, friend_id)
    if not friend_user:
        raise HTTPException(status_code=404, detail="Friend user not found")
    await friend_service.remove_friend(db, current_user, friend_user)
