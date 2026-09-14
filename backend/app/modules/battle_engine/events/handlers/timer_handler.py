import logging
from app.modules.battle_engine.events.event import BattleEvent

logger = logging.getLogger(__name__)


class TimerHandler:

    async def handle(
        self,
        event: BattleEvent,
    ):
        logger.info("[Timer] Handling event: %s", event.name)


timer_handler = TimerHandler()