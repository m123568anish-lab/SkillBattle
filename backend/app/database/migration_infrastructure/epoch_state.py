from __future__ import annotations

from collections.abc import Iterable
from enum import StrEnum


CONTROL_TABLES = frozenset({"qubira_epoch_control", "qubira_epoch_audit"})
ACTIVE_VERSION_TABLE = "alembic_version_epoch"


class EpochControlStateError(RuntimeError):
    """Raised when epoch control objects are incomplete or out of phase."""


class EpochObjectState(StrEnum):
    ABSENT = "absent"
    CONTROL_BOOTSTRAPPED = "control_bootstrapped"
    COMPLETE = "complete"


def classify_epoch_objects(table_names: Iterable[str]) -> EpochObjectState:
    names = set(table_names)
    present_control = names & CONTROL_TABLES
    has_version = ACTIVE_VERSION_TABLE in names

    if not present_control and not has_version:
        return EpochObjectState.ABSENT
    if present_control == CONTROL_TABLES and not has_version:
        return EpochObjectState.CONTROL_BOOTSTRAPPED
    if present_control == CONTROL_TABLES and has_version:
        return EpochObjectState.COMPLETE
    raise EpochControlStateError(
        "Epoch control objects are partially present or inconsistent; "
        "manual inspection is required."
    )


def require_epoch_objects(
    table_names: Iterable[str],
    expected: EpochObjectState,
) -> None:
    actual = classify_epoch_objects(table_names)
    if actual != expected:
        raise EpochControlStateError(
            f"Expected epoch object state {expected.value!r}, found {actual.value!r}."
        )


def assert_legacy_runner_allowed(table_names: Iterable[str]) -> None:
    """Refuse the legacy lineage once any epoch transition state is present."""
    state = classify_epoch_objects(table_names)
    if state is not EpochObjectState.ABSENT:
        raise EpochControlStateError(
            "Legacy Alembic runner refused because epoch transition objects exist; "
            "use the authorized recovery procedure."
        )
