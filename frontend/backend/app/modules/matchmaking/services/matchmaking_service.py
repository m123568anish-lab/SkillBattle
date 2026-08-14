import uuid
from datetime import datetime

from app.modules.matchmaking.managers.queue_manager import (
    queue_manager,
)
from app.modules.matchmaking.managers.rating_manager import (
    rating_manager,
)
from app.modules.matchmaking.models.match import Match


class MatchmakingService:

    def find_match(
        self,
        mode: str,
    ) -> Match | None:

        queue = queue_manager.get_queue(mode)

        if len(queue) < 2:
            return None

        # First come, first served
        queue.sort(key=lambda player: player.waiting_since)

        for i in range(len(queue)):

            first = queue[i]

            for j in range(i + 1, len(queue)):

                second = queue[j]

                # Skip same player
                if first.user_id == second.user_id:
                    continue

                # Region check
                if first.region != second.region:
                    continue

                # Rating compatibility
                if not rating_manager.compatible(
                    first,
                    second,
                ):
                    continue

                # Remove players from queue
                queue.remove(first)
                queue.remove(second)

                return Match(
                    id=str(uuid.uuid4()),
                    player_one=first.user_id,
                    player_two=second.user_id,
                    mode=mode,
                    created_at=datetime.utcnow(),
                    room_id=str(uuid.uuid4()),
                )

        return None


matchmaking_service = MatchmakingService()