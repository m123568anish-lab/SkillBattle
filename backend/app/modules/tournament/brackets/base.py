from abc import ABC
from abc import abstractmethod


class BracketGenerator(ABC):

    @abstractmethod
    def generate(

        self,

        participants,

    ):

        ...