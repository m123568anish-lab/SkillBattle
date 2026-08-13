class JudgeException(Exception):
    """Base judge exception."""


class CompilationError(JudgeException):
    pass


class RuntimeErrorException(JudgeException):
    pass


class TimeLimitExceeded(JudgeException):
    pass


class MemoryLimitExceeded(JudgeException):
    pass


class OutputLimitExceeded(JudgeException):
    pass