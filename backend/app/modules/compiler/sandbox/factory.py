from .local_runner import LocalRunner


class SandboxFactory:

    def __init__(self):

        self._runner = LocalRunner()

    def execute(

        self,

        language: str,

        source_code: str,

        stdin: str = "",

    ):

        return self._runner.execute(

            language,

            source_code,

            stdin,

        )


sandbox = SandboxFactory()