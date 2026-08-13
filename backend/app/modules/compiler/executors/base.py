import os
import shutil
import tempfile
import time
import uuid
from abc import ABC, abstractmethod

from app.modules.compiler.schemas import ExecutionResult


class BaseExecutor(ABC):
    """
    Base class for all language executors.
    """

    def __init__(self):
        self.timeout = 3

    # ==========================================================
    # Workspace
    # ==========================================================

    def create_workspace(self) -> str:

        workspace = os.path.join(
            tempfile.gettempdir(),
            "skillbattle",
            str(uuid.uuid4()),
        )

        os.makedirs(
            workspace,
            exist_ok=True,
        )

        return workspace

    # ==========================================================
    # Cleanup
    # ==========================================================

    def cleanup(
        self,
        workspace: str,
    ):

        shutil.rmtree(
            workspace,
            ignore_errors=True,
        )

    # ==========================================================
    # Save File
    # ==========================================================

    def save_source(
        self,
        workspace: str,
        filename: str,
        source_code: str,
    ) -> str:

        path = os.path.join(
            workspace,
            filename,
        )

        with open(
            path,
            "w",
            encoding="utf-8",
        ) as file:

            file.write(source_code)

        return path

    # ==========================================================
    # Timer
    # ==========================================================

    def start_timer(self):

        return time.perf_counter()

    def stop_timer(
        self,
        start_time: float,
    ) -> int:

        return int(
            (time.perf_counter() - start_time)
            * 1000
        )

    # ==========================================================
    # Execute
    # ==========================================================

    @abstractmethod
    def execute(
        self,
        source_code: str,
        stdin: str = "",
    ) -> ExecutionResult:
        """
        Execute source code.

        Must be implemented by every executor.
        """
        raise NotImplementedError("Executor must implement `execute()`")