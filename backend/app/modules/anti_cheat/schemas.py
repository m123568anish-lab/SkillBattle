from pydantic import BaseModel


class PlagiarismRequest(BaseModel):

    language: str

    source_code: str

    reference_code: str


class PlagiarismReport(BaseModel):

    similarity_score: float

    logic_similarity: str

    structure_similarity: str

    variable_similarity: str

    algorithm_similarity: str

    copy_probability: int

    reasoning: str