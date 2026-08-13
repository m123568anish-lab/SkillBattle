from enum import Enum


class Verdict(str, Enum):

    ACCEPTED = "Accepted"

    WRONG_ANSWER = "Wrong Answer"

    COMPILATION_ERROR = "Compilation Error"

    RUNTIME_ERROR = "Runtime Error"

    TIME_LIMIT_EXCEEDED = "Time Limit Exceeded"

    MEMORY_LIMIT_EXCEEDED = "Memory Limit Exceeded"

    OUTPUT_LIMIT_EXCEEDED = "Output Limit Exceeded"

    PRESENTATION_ERROR = "Presentation Error"

    INTERNAL_ERROR = "Internal Error"