import shutil
import tempfile
from pathlib import Path


class Workspace:

    def __init__(self):

        self.path = Path(
            tempfile.mkdtemp(
                prefix="skillbattle_"
            )
        )

    def file(self, name):

        return self.path / name

    def cleanup(self):

        shutil.rmtree(
            self.path,
            ignore_errors=True,
        )