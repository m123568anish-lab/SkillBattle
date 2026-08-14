from abc import ABC
from abc import abstractmethod

from .result import SandboxResult


class Sandbox(ABC):

    @abstractmethod
    def execute(

        self,

        language: str,

        source_code: str,

        stdin: str,

    ) -> SandboxResult:

        raise NotImplementedError