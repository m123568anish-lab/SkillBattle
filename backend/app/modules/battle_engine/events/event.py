from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass(slots=True)
class BattleEvent:

    name: str

    room_id: str

    user_id: str | None = None

    payload: dict[str, Any] = field(
        default_factory=dict
    )

    timestamp: datetime = field(
        default_factory=datetime.utcnow
    )