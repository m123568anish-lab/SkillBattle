import pytest


@pytest.fixture(autouse=True)
def clean_dependency_overrides():
    yield
