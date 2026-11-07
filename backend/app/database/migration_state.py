from __future__ import annotations

import ast
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from alembic.script import ScriptDirectory
from sqlalchemy import Connection, inspect, text


class MigrationStateError(RuntimeError):
    """Raised when revision metadata cannot safely describe a database."""


@dataclass(frozen=True)
class MigrationState:
    current_revision: str | None
    expected_head: str
    table_names: frozenset[str]


def _literal_string(node: ast.AST) -> str | None:
    return node.value if isinstance(node, ast.Constant) and isinstance(node.value, str) else None


def _branch_for_known_table_test(
    test: ast.AST,
    table_names: set[str],
) -> bool | None:
    if not isinstance(test, ast.Compare) or len(test.ops) != 1 or len(test.comparators) != 1:
        return None
    table_name = _literal_string(test.left)
    if table_name is None:
        return None
    right = test.comparators[0]
    reads_table_names = (
        isinstance(right, ast.Call)
        and isinstance(right.func, ast.Attribute)
        and right.func.attr == "get_table_names"
    ) or isinstance(right, ast.Name)
    if not reads_table_names:
        return None
    if isinstance(test.ops[0], ast.In):
        return table_name in table_names
    if isinstance(test.ops[0], ast.NotIn):
        return table_name not in table_names
    return None


class _TableOperationInspector(ast.NodeVisitor):
    def __init__(self, table_names: Iterable[str], revision: str) -> None:
        self.table_names = set(table_names)
        self.revision = revision
        self.conflicts: list[str] = []

    def visit_Module(self, node: ast.Module) -> None:
        for statement in node.body:
            is_function = isinstance(statement, (ast.FunctionDef, ast.AsyncFunctionDef))
            if is_function and statement.name == "upgrade":
                self.visit(statement)

    def visit_If(self, node: ast.If) -> None:
        branch = _branch_for_known_table_test(node.test, self.table_names)
        if branch is True:
            for statement in node.body:
                self.visit(statement)
        elif branch is False:
            for statement in node.orelse:
                self.visit(statement)
        else:
            for statement in (*node.body, *node.orelse):
                self.visit(statement)

    def visit_Call(self, node: ast.Call) -> None:
        if not (
            isinstance(node.func, ast.Attribute)
            and isinstance(node.func.value, ast.Name)
            and node.func.value.id == "op"
        ):
            self.generic_visit(node)
            return

        operation = node.func.attr
        table_name = _literal_string(node.args[0]) if node.args else None
        if table_name and operation == "create_table":
            if table_name in self.table_names:
                self.conflicts.append(
                    f"{self.revision}: create_table({table_name!r}) targets an existing table"
                )
            else:
                self.table_names.add(table_name)
        elif table_name and operation == "drop_table":
            if table_name not in self.table_names:
                self.conflicts.append(
                    f"{self.revision}: drop_table({table_name!r}) targets a missing table"
                )
            else:
                self.table_names.remove(table_name)
        self.generic_visit(node)


def find_missing_applied_tables(
    script: ScriptDirectory,
    state: MigrationState,
) -> tuple[str, ...]:
    if state.current_revision is None:
        return ()
    try:
        applied = list(script.iterate_revisions(state.current_revision, "base"))
    except Exception as exc:
        raise MigrationStateError(
            "Cannot determine the database's applied revision ancestry."
        ) from exc
    applied.reverse()
    expected_tables: set[str] = set()
    for revision in applied:
        path = Path(revision.path)
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        except (OSError, SyntaxError):
            continue
        upgrade = next(
            (
                node
                for node in tree.body
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
                and node.name == "upgrade"
            ),
            None,
        )
        if upgrade is None:
            continue
        for node in ast.walk(upgrade):
            if not isinstance(node, ast.Call) or not isinstance(node.func, ast.Attribute):
                continue
            if not isinstance(node.func.value, ast.Name) or node.func.value.id != "op":
                continue
            table_name = _literal_string(node.args[0]) if node.args else None
            if not table_name:
                continue
            if node.func.attr == "create_table":
                expected_tables.add(table_name)
            elif node.func.attr == "drop_table":
                expected_tables.discard(table_name)

    return tuple(sorted(expected_tables - set(state.table_names)))


def find_pending_table_conflicts(
    script: ScriptDirectory,
    state: MigrationState,
) -> tuple[str, ...]:
    full_history = list(script.iterate_revisions(state.expected_head, "base"))
    applied_history = (
        set()
        if state.current_revision is None
        else {
            revision.revision
            for revision in script.iterate_revisions(state.current_revision, "base")
        }
    )
    pending = [
        revision
        for revision in reversed(full_history)
        if revision.revision not in applied_history
    ]

    table_names = set(state.table_names) - {"alembic_version", "sqlite_sequence"}
    conflicts: list[str] = []
    for revision in pending:
        path = Path(revision.path)
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        except (OSError, SyntaxError) as exc:
            conflicts.append(f"{revision.revision}: migration source cannot be inspected ({type(exc).__name__})")
            continue
        inspector = _TableOperationInspector(
            table_names,
            revision.revision,
        )
        inspector.visit(tree)
        table_names = inspector.table_names
        conflicts.extend(inspector.conflicts)
    return tuple(conflicts)


def inspect_migration_state(
    connection: Connection,
    script: ScriptDirectory,
) -> MigrationState:
    heads = script.get_heads()
    if len(heads) != 1:
        raise MigrationStateError(
            f"Expected exactly one repository Alembic head; found {len(heads)}: {heads}"
        )

    tables = frozenset(inspect(connection).get_table_names())
    if "alembic_version" not in tables:
        application_tables = tables - {"sqlite_sequence"}
        if application_tables:
            raise MigrationStateError(
                "Application tables exist without Alembic revision metadata; "
                "refusing to infer or stamp a revision."
            )
        return MigrationState(None, heads[0], tables)

    try:
        revision_rows = connection.execute(
            text("SELECT version_num FROM alembic_version")
        ).scalars().all()
    except Exception as exc:
        raise MigrationStateError(
            "The alembic_version table is malformed or unreadable."
        ) from exc

    if len(revision_rows) != 1:
        raise MigrationStateError(
            "Expected exactly one applied Alembic revision; "
            f"found {len(revision_rows)}. Refusing automatic repair."
        )

    current_revision = revision_rows[0]
    if not isinstance(current_revision, str) or not re.fullmatch(
        r"[A-Za-z0-9_-]{1,128}", current_revision
    ):
        raise MigrationStateError(
            "Database revision identifier contains invalid characters."
        )
    try:
        revision = script.get_revision(current_revision)
    except Exception as exc:
        raise MigrationStateError(
            f"Database revision {current_revision!r} is not present in the repository."
        ) from exc
    if revision is None:
        raise MigrationStateError(
            f"Database revision {current_revision!r} is not present in the repository."
        )

    try:
        list(script.iterate_revisions(heads[0], current_revision))
    except Exception as exc:
        raise MigrationStateError(
            f"Database revision {current_revision!r} is not an ancestor of "
            f"the sole repository head {heads[0]!r}."
        ) from exc

    return MigrationState(current_revision, heads[0], tables)
