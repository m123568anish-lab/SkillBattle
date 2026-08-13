from pathlib import Path

from app.modules.compiler.config import (
    get_language,
)

from app.modules.compiler.core.execution_manager import (
    execution_manager,
)

from .workspace import Workspace
from .result import SandboxResult


class LocalRunner:

    def execute(

        self,

        language: str,

        source_code: str,

        stdin: str = "",

    ) -> SandboxResult:

        lang = get_language(language)

        with Workspace() as workspace:

            source = workspace.create_file(

                f"Main{lang.extension}",

                source_code,

            )

            result = execution_manager.execute(

                language=language,

                source=Path(source),

                workspace=workspace.path,

                stdin=stdin,

            )

            return SandboxResult(

                stdout=result.stdout,

                stderr=result.stderr,

                return_code=result.return_code,

                execution_time=result.execution_time,

                memory_used=0,

                success=result.success,

            )