import hashlib
import hmac
import json

import httpx


class WebhookSender:

    async def send(

        self,

        webhook,

        event,

        payload,

    ):

        body = json.dumps(payload)

        signature = hmac.new(

            webhook.secret.encode(),

            body.encode(),

            hashlib.sha256,

        ).hexdigest()

        async with httpx.AsyncClient() as client:

            await client.post(

                webhook.url,

                json={

                    "event": event,

                    "data": payload,

                },

                headers={

                    "X-SkillBattle-Signature": signature,

                },

                timeout=10,

            )


webhook_sender = WebhookSender()