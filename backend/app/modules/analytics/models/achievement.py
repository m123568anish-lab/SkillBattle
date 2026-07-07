from dataclasses import dataclass


@dataclass(slots=True)
class Achievement:

    id: str

    name: str

    description: str

    icon: str

    unlocked: bool = False