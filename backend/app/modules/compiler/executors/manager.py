from app.modules.compiler.executors.python_executor import (
    PythonExecutor,
)

from app.modules.compiler.executors.cpp_executor import (
    CppExecutor,
)

from app.modules.compiler.executors.c_executor import (
    CExecutor,
)

from app.modules.compiler.executors.java_executor import (
    JavaExecutor,
)

from app.modules.compiler.executors.javascript_executor import (
    JavaScriptExecutor,
)


class ExecutionManager:

    """
    Factory responsible for selecting
    the correct language executor.
    """

    def __init__(self):

        self.executors = {

            "python": PythonExecutor(),

            "cpp": CppExecutor(),

            "c": CExecutor(),

            "java": JavaExecutor(),

            "javascript": JavaScriptExecutor(),

        }

    # ================================================

    def supported_languages(self):

        return list(
            self.executors.keys()
        )

    # ================================================

    def get_executor(
        self,
        language: str,
    ):

        language = language.lower()

        if language not in self.executors:

            raise ValueError(

                f"Unsupported language: {language}"

            )

        return self.executors[language]

    # ================================================

    def execute(
        self,
        language: str,
        source_code: str,
        stdin: str = "",
    ):

        executor = self.get_executor(
            language,
        )

        return executor.execute(

            source_code,

            stdin,

        )


execution_manager = ExecutionManager()