from abc import ABC
from abc import abstractmethod


class RatingProvider(ABC):

    @abstractmethod
    def compatible(
        self,
        first: int,
        second: int,
        waiting_seconds: int,
    ) -> bool:
        ...