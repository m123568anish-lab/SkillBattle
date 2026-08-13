from .sender import webhook_sender
from .repository import webhook_repository


class WebhookDispatcher:
    async def dispatch(self, db, user_id, event, payload):
        """Dispatch `event` with `payload` to all active webhooks for `user_id`."""

        hooks = webhook_repository.list(db, user_id)

        for hook in hooks:
            if getattr(hook, "active", True):
                await webhook_sender.send(hook, event, payload)


webhook_dispatcher = WebhookDispatcher()