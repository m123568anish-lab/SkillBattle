"""
=========================================================

SkillBattle

Execution Sandbox

=========================================================
"""

from __future__ import annotations

import shutil
import tempfile
from pathlib import Path


class Sandbox:

    def __init__(self):

        self.workspace = Path(
            tempfile.mkdtemp(
                prefix="skillbattle_",
            )
        )

    def write_file(
        self,
        filename: str,
        content: str,
    ) -> Path:

        file_path = self.workspace / filename

        file_path.write_text(
            content,
            encoding="utf-8",
        )

        return file_path

    def path(self) -> str:

        return str(self.workspace)

    def cleanup(self):

        shutil.rmtree(
            self.workspace,
            ignore_errors=True,
        )