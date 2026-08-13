from abc import ABC
from abc import abstractmethod


class QueuePolicy(ABC):

    @abstractmethod
    def max_players(self):

        ...

    @abstractmethod
    def ranked(self):

        ...