import logging
from app.modules.battle_engine.events.event import BattleEvent

logger = logging.getLogger(__name__)


class SyncHandler:

    async def handle(
        self,
        event: BattleEvent,
    ):
        logger.info("[Sync] Handling event: %s", event.name)


sync_handler = SyncHandler()