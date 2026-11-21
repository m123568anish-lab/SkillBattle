import json
import logging
import httpx

from app.core.security.ssrf import validate_url_for_ssrf
from app.core.security.webhook_verifier import sign_webhook_payload

logger = logging.getLogger(__name__)


class WebhookSender:

    async def send(
        self,
        webhook,
        event,
        payload,
    ):
        target_url = getattr(webhook, "url", "")
        # SSRF Protection: verify destination URL is not private, loopback, or cloud metadata
        if not validate_url_for_ssrf(target_url):
            logger.error("Outbound webhook dispatch blocked by SSRF defense: target=%s", target_url)
            return False

        body = json.dumps(payload, separators=(",", ":"))
        secret = getattr(webhook, "secret", "")
        signature_header, timestamp = sign_webhook_payload(body.encode("utf-8"), secret)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    target_url,
                    json={
                        "event": event,
                        "data": payload,
                    },
                    headers={
                        "X-SkillBattle-Signature": signature_header,
                        "X-Webhook-Timestamp": str(timestamp),
                        "Content-Type": "application/json",
                    },
                    timeout=10,
                )
                return response.is_success
        except Exception as exc:
            logger.warning("Outbound webhook delivery failed to %s: %s", target_url, exc)
            return False


webhook_sender = WebhookSender()
