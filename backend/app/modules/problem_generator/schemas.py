from pydantic import BaseModel


class GenerateProblemRequest(BaseModel):

    difficulty: str

    topic: str

    company: str | None = None


class GeneratedProblem(BaseModel):

    title: str

    difficulty: str

    statement: str

    constraints: str

    input_format: str

    output_format: str

    examples: list

    hidden_testcases: list

    starter_code: dict

    solution: str

    time_limit: int

    memory_limit: int