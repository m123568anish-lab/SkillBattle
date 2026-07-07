from .runners.python_runner import PythonRunner
from .runners.cpp_runner import CppRunner


class SandboxFactory:

    def get_runner(

        self,

        language,

    ):

        language = language.lower()

        if language == "python":

            return PythonRunner()

        if language == "cpp":

            return CppRunner()

        raise ValueError(

            f"Unsupported language: {language}"

        )


sandbox = SandboxFactory()