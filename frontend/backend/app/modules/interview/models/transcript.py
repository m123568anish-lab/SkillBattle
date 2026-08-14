from dataclasses import dataclass, field
from datetime import datetime


@dataclass(slots=True)
class TranscriptEntry:

    speaker: str

    message: str

    timestamp: datetime = field(
        default_factory=datetime.utcnow
    )