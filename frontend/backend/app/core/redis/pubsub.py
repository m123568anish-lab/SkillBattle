"""
=========================================================

Redis Pub/Sub

=========================================================
"""

from __future__ import annotations

from app.core.redis.client import (
    redis_manager,
)


class PubSubService:

    async def publish(

        self,

        channel: str,

        message: str,

    ):

        await redis_manager.client.publish(

            channel,

            message,

        )

    async def subscribe(

        self,

        channel: str,

    ):

        pubsub = redis_manager.client.pubsub()

        await pubsub.subscribe(channel)

        return pubsub


pubsub_service = PubSubService()