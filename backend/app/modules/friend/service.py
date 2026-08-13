"""
Friendship service – higher‑level business logic.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.modules.friend.repository import friend_repository


class FriendService:
    async def get_friends(self, db: AsyncSession, user: User):
        """Return a list of User objects that are friends of the given user.
        For simplicity we return the Friendship rows; the caller can map to User.
        """
        return await friend_repository.get_friends(db, user.id)

    async def add_friend(self, db: AsyncSession, user: User, friend_user: User):
        return await friend_repository.add_friend(db, user.id, friend_user.id)

    async def remove_friend(self, db: AsyncSession, user: User, friend_user: User):
        return await friend_repository.remove_friend(db, user.id, friend_user.id)

friend_service = FriendService()
