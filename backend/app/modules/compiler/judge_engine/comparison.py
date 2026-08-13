"""
Output comparison utilities.
"""


def normalize(text: str) -> str:
    """
    Ignore trailing spaces and blank lines.
    """

    return "\n".join(
        line.rstrip()
        for line in text.strip().splitlines()
    )


def compare_output(
    expected: str,
    actual: str,
) -> bool:
    """
    Compares normalized outputs.
    """

    return normalize(expected) == normalize(actual)