import ast


def ast_dump(code):

    try:

        tree = ast.parse(code)

        return ast.dump(tree)

    except Exception:

        return ""