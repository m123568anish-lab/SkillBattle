from __future__ import annotations

import shutil
import tempfile
from pathlib import Path


class Workspace:

    """
    Temporary isolated workspace for compilation
    and execution.
    """

    def __init__(self):

        self.root = Path(
            tempfile.mkdtemp(
                prefix="skillbattle_",
            )
        )

    @property
    def path(self) -> Path:
        return self.root

    def create_file(
        self,
        filename: str,
        content: str,
    ) -> Path:

        file = self.root / filename

        file.write_text(
            content,
            encoding="utf-8",
        )

        return file

    def cleanup(self):

        shutil.rmtree(
            self.root,
            ignore_errors=True,
        )

    def __enter__(self):

        return self

    def __exit__(
        self,
        exc_type,
        exc,
        tb,
    ):

        self.cleanup()