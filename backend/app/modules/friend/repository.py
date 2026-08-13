from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, exists, delete
from app.models.friend import Friendship


class FriendRepository:
    async def get_friends(self, db: AsyncSession, user_id: str):
        """Return a list of Friendship objects where the user participates."""
        stmt = select(Friendship).where(
            (Friendship.user_id == user_id) | (Friendship.friend_id == user_id)
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    async def add_friend(self, db: AsyncSession, user_id: str, friend_id: str):
        """Create a friendship if it does not already exist."""
        # Store smaller UUID first to keep uniqueness
        if user_id > friend_id:
            user_id, friend_id = friend_id, user_id
        exists_stmt = select(exists().where(
            (Friendship.user_id == user_id) & (Friendship.friend_id == friend_id)
        ))
        result = await db.execute(exists_stmt)
        if result.scalar():
            return None
        friendship = Friendship(user_id=user_id, friend_id=friend_id)
        db.add(friendship)
        await db.commit()
        await db.refresh(friendship)
        return friendship

    async def remove_friend(self, db: AsyncSession, user_id: str, friend_id: str):
        """Delete a friendship pair."""
        if user_id > friend_id:
            user_id, friend_id = friend_id, user_id
        stmt = delete(Friendship).where(
            (Friendship.user_id == user_id) & (Friendship.friend_id == friend_id)
        )
        await db.execute(stmt)
        await db.commit()
        return True

friend_repository = FriendRepository()
