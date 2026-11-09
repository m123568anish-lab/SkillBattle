from __future__ import annotations

import hashlib
import json
import re
from collections.abc import Mapping
from dataclasses import dataclass
from enum import StrEnum
from typing import Any, Protocol

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Column,
    DateTime,
    Integer,
    MetaData,
    SmallInteger,
    String,
    Table,
    UniqueConstraint,
    inspect,
    select,
    text,
)

from sqlalchemy.engine import Connection

from app.database.migration_infrastructure.epoch_state import (
    CONTROL_TABLES,
    EpochControlStateError,
)


class EpochTransitionState(StrEnum):
    UNCLASSIFIED = "unclassified"
    FRESH_PREFLIGHT = "fresh_preflight"
    ADOPTION_PREFLIGHT = "adoption_preflight"
    STARTED = "started"
    APPLYING = "applying"
    COMMITTED_UNVERIFIED = "committed_unverified"
    VERIFIED = "verified"
    RECOVERY_REQUIRED = "recovery_required"
    REFUSED = "refused"


_DIGEST = re.compile(r"^[0-9a-f]{64}$")
_IDENTIFIER = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$")
_STATES = tuple(state.value for state in EpochTransitionState)
APPROVED_ADOPTION_PROFILE_DIGESTS: frozenset[str] = frozenset()
_METADATA = MetaData()
_EVENT_ID = BigInteger().with_variant(Integer, "sqlite")

EPOCH_CONTROL_TABLE = Table(
    "qubira_epoch_control",
    _METADATA,
    Column("singleton_id", SmallInteger, primary_key=True, autoincrement=False),
    Column("state", String(32), nullable=False),
    Column("generation", BigInteger, nullable=False),
    Column("idempotency_key", String(160), nullable=False),
    Column("profile_digest", String(64)),
    Column("plan_digest", String(64)),
    Column("source_fingerprint_digest", String(64)),
    Column("target_fingerprint_digest", String(64)),
    Column("database_identity_digest", String(64)),
    Column("authorization_id", String(120)),
    Column("authorization_digest", String(64)),
    Column("recovery_resolution_id", String(120)),
    Column("updated_at", DateTime(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")),
    CheckConstraint("singleton_id = 1", name="ck_qubira_epoch_control_singleton"),
    CheckConstraint(
        "state IN (" + ", ".join(f"'{state}'" for state in _STATES) + ")",
        name="ck_qubira_epoch_control_state",
    ),
)

EPOCH_AUDIT_TABLE = Table(
    "qubira_epoch_audit",
    _METADATA,
    Column("event_id", _EVENT_ID, primary_key=True, autoincrement=True),
    Column("generation", BigInteger, nullable=False, unique=True),
    Column("from_state", String(32)),
    Column("to_state", String(32), nullable=False),
    Column("idempotency_key", String(160), nullable=False),
    Column("actor_role", String(120), nullable=False),
    Column("profile_digest", String(64)),
    Column("plan_digest", String(64)),
    Column("source_fingerprint_digest", String(64)),
    Column("target_fingerprint_digest", String(64)),
    Column("database_identity_digest", String(64)),
    Column("authorization_id", String(120)),
    Column("authorization_digest", String(64)),
    Column("recovery_resolution_id", String(120)),
    Column("previous_event_digest", String(64)),
    Column("event_digest", String(64), nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")),
    UniqueConstraint("idempotency_key", name="uq_qubira_epoch_audit_idempotency"),
    CheckConstraint(
        "to_state IN (" + ", ".join(f"'{state}'" for state in _STATES) + ")",
        name="ck_qubira_epoch_audit_to_state",
    ),
    CheckConstraint(
        "from_state IS NULL OR from_state IN ("
        + ", ".join(f"'{state}'" for state in _STATES)
        + ")",
        name="ck_qubira_epoch_audit_from_state",
    ),
)

_CONTROL_FIELDS = (
    "profile_digest",
    "plan_digest",
    "source_fingerprint_digest",
    "target_fingerprint_digest",
    "database_identity_digest",
    "authorization_id",
    "authorization_digest",
    "recovery_resolution_id",
)

_AUDIT_DIGEST_FIELDS = (
    "generation",
    "from_state",
    "to_state",
    "idempotency_key",
    "actor_role",
    *_CONTROL_FIELDS,
    "previous_event_digest",
)


def _audit_event_digest(event: Mapping[str, Any]) -> str:
    canonical = {
        field: event[field]
        for field in _AUDIT_DIGEST_FIELDS
    }
    payload = json.dumps(
        canonical,
        ensure_ascii=True,
        separators=(",", ":"),
        sort_keys=True,
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def epoch_database_identity_digest(connection: Connection) -> str:
    if connection.dialect.name != "postgresql":
        raise EpochControlStateError(
            "Epoch database identity is supported only for PostgreSQL."
        )
    identity = connection.execute(
        text(
            "SELECT current_database(), current_user, "
            "(SELECT oid FROM pg_database WHERE datname = current_database())"
        )
    ).one()
    payload = json.dumps(
        tuple(identity),
        ensure_ascii=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


@dataclass(frozen=True)
class EpochTransition:
    to_state: EpochTransitionState
    idempotency_key: str
    actor_role: str
    profile_digest: str | None = None
    plan_digest: str | None = None
    source_fingerprint_digest: str | None = None
    target_fingerprint_digest: str | None = None
    database_identity_digest: str | None = None
    authorization_id: str | None = None
    authorization_digest: str | None = None
    recovery_resolution_id: str | None = None


class EpochAuthorizationVerifier(Protocol):
    def verify(
        self,
        authorization_id: str,
        authorization_digest: str,
        purpose: str,
    ) -> bool: ...


_NORMAL_TRANSITIONS = {
    EpochTransitionState.UNCLASSIFIED: {
        EpochTransitionState.FRESH_PREFLIGHT,
        EpochTransitionState.ADOPTION_PREFLIGHT,
        EpochTransitionState.REFUSED,
    },
    EpochTransitionState.FRESH_PREFLIGHT: {
        EpochTransitionState.STARTED,
        EpochTransitionState.REFUSED,
    },
    EpochTransitionState.ADOPTION_PREFLIGHT: {
        EpochTransitionState.STARTED,
        EpochTransitionState.REFUSED,
    },
    EpochTransitionState.STARTED: {
        EpochTransitionState.APPLYING,
        EpochTransitionState.RECOVERY_REQUIRED,
    },
    EpochTransitionState.APPLYING: {
        EpochTransitionState.COMMITTED_UNVERIFIED,
        EpochTransitionState.RECOVERY_REQUIRED,
    },
    EpochTransitionState.COMMITTED_UNVERIFIED: {
        EpochTransitionState.VERIFIED,
        EpochTransitionState.RECOVERY_REQUIRED,
    },
    EpochTransitionState.RECOVERY_REQUIRED: set(),
    EpochTransitionState.VERIFIED: set(),
    EpochTransitionState.REFUSED: set(),
}


def create_epoch_control_schema(connection: Connection) -> None:
    """Create the two control tables atomically; the caller must commit explicitly."""
    names = set(inspect(connection).get_table_names())
    if names:
        raise EpochControlStateError(
            "Epoch control bootstrap requires an empty schema; existing-schema "
            "adoption is a separate, blocked operation."
        )
    EPOCH_CONTROL_TABLE.create(connection, checkfirst=False)
    EPOCH_AUDIT_TABLE.create(connection, checkfirst=False)
    if connection.dialect.name == "sqlite":
        connection.exec_driver_sql(
            "CREATE TRIGGER qubira_epoch_audit_no_update "
            "BEFORE UPDATE ON qubira_epoch_audit "
            "BEGIN SELECT RAISE(ABORT, 'epoch audit is append-only'); END"
        )
        connection.exec_driver_sql(
            "CREATE TRIGGER qubira_epoch_audit_no_delete "
            "BEFORE DELETE ON qubira_epoch_audit "
            "BEGIN SELECT RAISE(ABORT, 'epoch audit is append-only'); END"
        )
    elif connection.dialect.name == "postgresql":
        connection.exec_driver_sql(
            "CREATE FUNCTION qubira_reject_epoch_audit_mutation() "
            "RETURNS trigger LANGUAGE plpgsql AS $$ "
            "BEGIN RAISE EXCEPTION 'epoch audit is append-only'; END; $$"
        )
        connection.exec_driver_sql(
            "CREATE TRIGGER qubira_epoch_audit_no_update_delete "
            "BEFORE UPDATE OR DELETE ON qubira_epoch_audit "
            "FOR EACH ROW EXECUTE FUNCTION qubira_reject_epoch_audit_mutation()"
        )


def _validate_metadata(transition: EpochTransition) -> None:
    if not _IDENTIFIER.fullmatch(transition.idempotency_key):
        raise EpochControlStateError("Epoch idempotency key is malformed.")
    if not _IDENTIFIER.fullmatch(transition.actor_role):
        raise EpochControlStateError("Epoch actor role is malformed.")
    for field in _CONTROL_FIELDS:
        value = getattr(transition, field)
        if field.endswith("_digest") and value is not None and not _DIGEST.fullmatch(value):
            raise EpochControlStateError(f"Epoch {field} must be a lowercase SHA-256 digest.")
        if field == "authorization_id" and value is not None and not _IDENTIFIER.fullmatch(value):
            raise EpochControlStateError("Epoch authorization identifier is malformed.")
        if field == "recovery_resolution_id" and value is not None and not _IDENTIFIER.fullmatch(value):
            raise EpochControlStateError("Epoch recovery resolution identifier is malformed.")

    if transition.to_state is EpochTransitionState.ADOPTION_PREFLIGHT:
        if transition.profile_digest not in APPROVED_ADOPTION_PROFILE_DIGESTS:
            raise EpochControlStateError(
                "Existing-schema adoption is blocked; no historical profile is approved."
            )
        if not all(
            (
                transition.profile_digest,
                transition.source_fingerprint_digest,
                transition.authorization_id,
                transition.authorization_digest,
            )
        ):
            raise EpochControlStateError(
                "Adoption preflight requires profile, source, and authorization evidence."
            )
    if transition.to_state is EpochTransitionState.STARTED and not all(
        (
            transition.plan_digest,
            transition.target_fingerprint_digest,
            transition.database_identity_digest,
        )
    ):
        raise EpochControlStateError(
            "A started migration requires a plan and target fingerprint digest."
        )
    if transition.to_state is EpochTransitionState.FRESH_PREFLIGHT and (
        transition.recovery_resolution_id is not None
        and not all(
            (
                transition.authorization_id,
                transition.authorization_digest,
                transition.database_identity_digest,
                transition.plan_digest,
            )
        )
    ):
        raise EpochControlStateError(
            "Recovery preflight requires explicit operator authorization."
        )


def _state_from_value(value: object) -> EpochTransitionState:
    try:
        return EpochTransitionState(str(value))
    except ValueError as exc:
        raise EpochControlStateError("Epoch control contains an unknown state.") from exc


def validate_epoch_audit(
    connection: Connection,
    authorization_verifier: EpochAuthorizationVerifier | None = None,
) -> EpochTransitionState:
    """Verify that the singleton control row is exactly the end of its audit chain."""
    expected_control_columns = {
        "singleton_id",
        "state",
        "generation",
        "idempotency_key",
        *_CONTROL_FIELDS,
        "updated_at",
    }
    expected_audit_columns = {
        "event_id",
        "generation",
        "from_state",
        "to_state",
        "idempotency_key",
        "actor_role",
        *_CONTROL_FIELDS,
        "previous_event_digest",
        "event_digest",
        "created_at",
    }
    control_columns = {
        column["name"]
        for column in inspect(connection).get_columns(EPOCH_CONTROL_TABLE.name)
    }
    audit_columns = {
        column["name"]
        for column in inspect(connection).get_columns(EPOCH_AUDIT_TABLE.name)
    }
    if (
        control_columns != expected_control_columns
        or audit_columns != expected_audit_columns
    ):
        raise EpochControlStateError("Epoch control or audit table shape is malformed.")
    _validate_append_only_guards(connection)
    control_rows = connection.execute(
        select(EPOCH_CONTROL_TABLE).where(EPOCH_CONTROL_TABLE.c.singleton_id == 1)
    ).mappings().all()
    audit_rows = connection.execute(
        select(EPOCH_AUDIT_TABLE).order_by(EPOCH_AUDIT_TABLE.c.generation)
    ).mappings().all()
    if len(control_rows) != 1 or not audit_rows:
        raise EpochControlStateError(
            "Epoch control and audit state are missing or incomplete."
        )

    previous_state: EpochTransitionState | None = None
    previous_event_digest: str | None = None
    seen_keys: set[str] = set()
    for generation, row in enumerate(audit_rows, start=1):
        if row["generation"] != generation:
            raise EpochControlStateError("Epoch audit generations are not contiguous.")
        if row["idempotency_key"] in seen_keys:
            raise EpochControlStateError("Epoch audit contains a duplicate transition key.")
        seen_keys.add(row["idempotency_key"])
        if row["from_state"] != (
            previous_state.value if previous_state is not None else None
        ):
            raise EpochControlStateError("Epoch audit transition chain is broken.")
        if row["previous_event_digest"] != previous_event_digest:
            raise EpochControlStateError("Epoch audit digest chain is broken.")
        if row["event_digest"] != _audit_event_digest(row):
            raise EpochControlStateError("Epoch audit event digest is invalid.")
        next_state = _state_from_value(row["to_state"])
        expected_state = previous_state or EpochTransitionState.UNCLASSIFIED
        if next_state not in _NORMAL_TRANSITIONS[expected_state]:
            is_authorized_recovery_reset = (
                expected_state is EpochTransitionState.RECOVERY_REQUIRED
                and next_state is EpochTransitionState.FRESH_PREFLIGHT
                and row["recovery_resolution_id"] is not None
                and row["authorization_id"] is not None
                and row["authorization_digest"] is not None
                and row["database_identity_digest"] is not None
                and row["plan_digest"] is not None
            )
            if not is_authorized_recovery_reset:
                raise EpochControlStateError("Epoch audit contains an invalid state transition.")
            if (
                authorization_verifier is None
                or not authorization_verifier.verify(
                    row["authorization_id"],
                    row["authorization_digest"],
                    "epoch_recovery",
                )
            ):
                raise EpochControlStateError(
                    "Epoch recovery audit requires a trusted authorization verifier."
                )
        if next_state is EpochTransitionState.RECOVERY_REQUIRED and (
            expected_state
            not in {
                EpochTransitionState.STARTED,
                EpochTransitionState.APPLYING,
                EpochTransitionState.COMMITTED_UNVERIFIED,
            }
        ):
            raise EpochControlStateError("Epoch audit enters recovery from an invalid state.")
        previous_state = next_state
        previous_event_digest = row["event_digest"]

    control = control_rows[0]
    if control["generation"] != len(audit_rows):
        raise EpochControlStateError("Epoch control generation disagrees with its audit.")
    if _state_from_value(control["state"]) is not previous_state:
        raise EpochControlStateError("Epoch control state disagrees with its audit.")
    final_event = audit_rows[-1]
    for field in ("state", "generation", "idempotency_key", *_CONTROL_FIELDS):
        audit_field = "to_state" if field == "state" else field
        if control[field] != final_event[audit_field]:
            raise EpochControlStateError(
                f"Epoch control field {field!r} disagrees with the final audit event."
            )
    return previous_state


def record_epoch_transition(
    connection: Connection,
    expected_state: EpochTransitionState,
    transition: EpochTransition,
    authorization_verifier: EpochAuthorizationVerifier | None = None,
) -> None:
    """Persist one validated transition; transaction commit belongs to the caller."""
    _validate_metadata(transition)
    table_names = set(inspect(connection).get_table_names())
    if not CONTROL_TABLES <= table_names:
        raise EpochControlStateError("Epoch control tables are missing or partial.")
    if transition.idempotency_key in set(
        connection.execute(
            select(EPOCH_AUDIT_TABLE.c.idempotency_key)
        ).scalars()
    ):
        raise EpochControlStateError("Epoch transition idempotency key was already used.")

    control = connection.execute(
        select(EPOCH_CONTROL_TABLE)
        .where(EPOCH_CONTROL_TABLE.c.singleton_id == 1)
        .with_for_update()
    ).mappings().one_or_none()
    if control is None:
        actual_state = EpochTransitionState.UNCLASSIFIED
        generation = 0
    else:
        actual_state = validate_epoch_audit(connection, authorization_verifier)
        generation = int(control["generation"])

    if actual_state is not expected_state:
        raise EpochControlStateError(
            f"Epoch transition expected {expected_state.value!r}, "
            f"found {actual_state.value!r}."
        )
    permitted = _NORMAL_TRANSITIONS[expected_state]
    if transition.to_state not in permitted:
        recovery_transition = (
            expected_state is EpochTransitionState.RECOVERY_REQUIRED
            and transition.to_state is EpochTransitionState.FRESH_PREFLIGHT
            and transition.recovery_resolution_id is not None
            and transition.authorization_id is not None
            and transition.authorization_digest is not None
        )
        if recovery_transition and (
            authorization_verifier is None
            or not authorization_verifier.verify(
                transition.authorization_id,
                transition.authorization_digest,
                "epoch_recovery",
            )
        ):
            raise EpochControlStateError(
                "Recovery requires a trusted verifier and explicit operator authorization."
            )
        if not recovery_transition:
            raise EpochControlStateError(
                f"Invalid epoch transition {expected_state.value!r} -> "
                f"{transition.to_state.value!r}."
            )

    if transition.to_state is EpochTransitionState.RECOVERY_REQUIRED and (
        expected_state
        not in {
            EpochTransitionState.STARTED,
            EpochTransitionState.APPLYING,
            EpochTransitionState.COMMITTED_UNVERIFIED,
        }
    ):
        raise EpochControlStateError("Recovery cannot be entered from this state.")
    if expected_state is EpochTransitionState.RECOVERY_REQUIRED and (
        transition.to_state is EpochTransitionState.FRESH_PREFLIGHT
    ):
        if (
            control is None
            or transition.database_identity_digest
            != control["database_identity_digest"]
            or transition.plan_digest != control["plan_digest"]
        ):
            raise EpochControlStateError(
                "Recovery authorization must match the database identity and plan digest."
            )

    next_generation = generation + 1
    values: dict[str, Any] = {
        field: (
            getattr(transition, field)
            if getattr(transition, field) is not None
            else control[field] if control is not None else None
        )
        for field in _CONTROL_FIELDS
    }
    values["recovery_resolution_id"] = (
        transition.recovery_resolution_id
        if transition.recovery_resolution_id is not None
        else control["recovery_resolution_id"] if control is not None else None
    )
    prior_event = connection.execute(
        select(EPOCH_AUDIT_TABLE)
        .order_by(EPOCH_AUDIT_TABLE.c.generation.desc())
        .limit(1)
    ).mappings().one_or_none()
    audit_values = {
        "generation": next_generation,
        "from_state": (
            None if expected_state is EpochTransitionState.UNCLASSIFIED
            else expected_state.value
        ),
        "to_state": transition.to_state.value,
        "idempotency_key": transition.idempotency_key,
        "actor_role": transition.actor_role,
        **values,
        "previous_event_digest": (
            prior_event["event_digest"] if prior_event is not None else None
        ),
    }
    audit_values["event_digest"] = _audit_event_digest(audit_values)
    connection.execute(EPOCH_AUDIT_TABLE.insert().values(**audit_values))
    control_values = {
        "singleton_id": 1,
        "state": transition.to_state.value,
        "generation": next_generation,
        "idempotency_key": transition.idempotency_key,
        **values,
        "updated_at": text("CURRENT_TIMESTAMP"),
    }
    if control is None:
        connection.execute(EPOCH_CONTROL_TABLE.insert().values(**control_values))
    else:
        connection.execute(
            EPOCH_CONTROL_TABLE.update()
            .where(EPOCH_CONTROL_TABLE.c.singleton_id == 1)
            .values(**control_values)
        )


def epoch_control_snapshot(
    connection: Connection,
    authorization_verifier: EpochAuthorizationVerifier | None = None,
) -> Mapping[str, Any]:
    state = validate_epoch_audit(connection, authorization_verifier)
    control = connection.execute(
        select(EPOCH_CONTROL_TABLE).where(EPOCH_CONTROL_TABLE.c.singleton_id == 1)
    ).mappings().one()
    return {**dict(control), "state": state}


def _validate_append_only_guards(connection: Connection) -> None:
    if connection.dialect.name == "sqlite":
        names = set(
            connection.execute(
                text(
                    "SELECT name FROM sqlite_master WHERE type = 'trigger' "
                    "AND tbl_name = 'qubira_epoch_audit'"
                )
            ).scalars()
        )
        expected = {
            "qubira_epoch_audit_no_update",
            "qubira_epoch_audit_no_delete",
        }
        if not expected <= names:
            raise EpochControlStateError("Epoch audit append-only guards are missing.")
    elif connection.dialect.name == "postgresql":
        guarded = connection.execute(
            text(
                "SELECT COUNT(*) FROM pg_trigger "
                "WHERE tgrelid = 'qubira_epoch_audit'::regclass "
                "AND tgname = 'qubira_epoch_audit_no_update_delete' "
                "AND NOT tgisinternal"
            )
        ).scalar_one()
        if guarded != 1:
            raise EpochControlStateError("Epoch audit append-only guard is missing.")
    else:
        raise EpochControlStateError(
            f"Epoch audit validation is unsupported for {connection.dialect.name!r}."
        )
