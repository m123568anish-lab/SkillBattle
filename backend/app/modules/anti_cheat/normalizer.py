import re


def normalize(code: str):

    code = re.sub(r"#.*", "", code)

    code = re.sub(r"\s+", " ", code)

    return code.strip()