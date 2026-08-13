from dataclasses import dataclass


@dataclass
class Player:

    id: str

    username: str

    websocket: object | None = None

    score: int = 0

    connected: bool = True