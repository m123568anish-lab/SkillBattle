from app.modules.problem_generator.service import ProblemGeneratorService


def test_problem_generator_service_exposes_persist_and_save_generation_api():
    service = ProblemGeneratorService()

    assert hasattr(service, "generate_and_save")
    assert callable(service.generate_and_save)
