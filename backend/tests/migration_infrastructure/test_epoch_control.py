from __future__ import annotations

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.exc import IntegrityError

from app.database.migration_infrastructure.epoch_control import (
    EPOCH_AUDIT_TABLE,
    EpochTransition,
    EpochTransitionState,
    create_epoch_control_schema,
    record_epoch_transition,
    validate_epoch_audit,
)
from app.database.migration_infrastructure.epoch_state import EpochControlStateError


_DIGEST = "a" * 64


def _create_control(connection) -> None:
    create_epoch_control_schema(connection)
    connection.commit()


def _transition(
    connection,
    source: EpochTransitionState,
    target: EpochTransitionState,
    key: str,
    **metadata,
) -> None:
    if target is EpochTransitionState.STARTED:
        metadata.setdefault("database_identity_digest", _DIGEST)
    record_epoch_transition(
        connection,
        source,
        EpochTransition(
            to_state=target,
            idempotency_key=key,
            actor_role="test_operator",
            **metadata,
        ),
    )
    connection.commit()


def test_epoch_state_machine_validates_and_audits_each_ordered_transition() -> None:
    engine = create_engine("sqlite:///:memory:")
    try:
        with engine.connect() as connection:
            _create_control(connection)
            _transition(
                connection,
                EpochTransitionState.UNCLASSIFIED,
                EpochTransitionState.FRESH_PREFLIGHT,
                "preflight-1",
            )
            _transition(
                connection,
                EpochTransitionState.FRESH_PREFLIGHT,
                EpochTransitionState.STARTED,
                "start-1",
                plan_digest=_DIGEST,
                target_fingerprint_digest=_DIGEST,
            )
            _transition(
                connection,
                EpochTransitionState.STARTED,
                EpochTransitionState.APPLYING,
                "apply-1",
            )
            _transition(
                connection,
                EpochTransitionState.APPLYING,
                EpochTransitionState.COMMITTED_UNVERIFIED,
                "commit-1",
            )
            _transition(
                connection,
                EpochTransitionState.COMMITTED_UNVERIFIED,
                EpochTransitionState.VERIFIED,
                "verify-1",
            )

            assert validate_epoch_audit(connection) is EpochTransitionState.VERIFIED
            assert connection.execute(
                text("SELECT COUNT(*) FROM qubira_epoch_audit")
            ).scalar_one() == 5
    finally:
        engine.dispose()


def test_epoch_state_machine_rejects_out_of_order_duplicate_and_adoption() -> None:
    engine = create_engine("sqlite:///:memory:")
    try:
        with engine.connect() as connection:
            _create_control(connection)
            with pytest.raises(EpochControlStateError, match="blocked"):
                record_epoch_transition(
                    connection,
                    EpochTransitionState.UNCLASSIFIED,
                    EpochTransition(
                        to_state=EpochTransitionState.ADOPTION_PREFLIGHT,
                        idempotency_key="adoption-1",
                        actor_role="test_operator",
                        profile_digest=_DIGEST,
                        source_fingerprint_digest=_DIGEST,
                        authorization_id="operator-approval-1",
                        authorization_digest=_DIGEST,
                    ),
                )
            with pytest.raises(EpochControlStateError, match="Invalid epoch transition"):
                record_epoch_transition(
                    connection,
                    EpochTransitionState.UNCLASSIFIED,
                    EpochTransition(
                        to_state=EpochTransitionState.VERIFIED,
                        idempotency_key="verify-too-soon",
                        actor_role="test_operator",
                    ),
                )
            _transition(
                connection,
                EpochTransitionState.UNCLASSIFIED,
                EpochTransitionState.FRESH_PREFLIGHT,
                "preflight-1",
            )
            with pytest.raises(EpochControlStateError, match="already used"):
                record_epoch_transition(
                    connection,
                    EpochTransitionState.FRESH_PREFLIGHT,
                    EpochTransition(
                        to_state=EpochTransitionState.REFUSED,
                        idempotency_key="preflight-1",
                        actor_role="test_operator",
                    ),
                )
    finally:
        engine.dispose()


def test_epoch_recovery_requires_explicit_authorization_and_resolution() -> None:
    engine = create_engine("sqlite:///:memory:")
    try:
        with engine.connect() as connection:
            _create_control(connection)
            _transition(
                connection,
                EpochTransitionState.UNCLASSIFIED,
                EpochTransitionState.FRESH_PREFLIGHT,
                "preflight-1",
            )
            _transition(
                connection,
                EpochTransitionState.FRESH_PREFLIGHT,
                EpochTransitionState.STARTED,
                "start-1",
                plan_digest=_DIGEST,
                target_fingerprint_digest=_DIGEST,
            )
            _transition(
                connection,
                EpochTransitionState.STARTED,
                EpochTransitionState.APPLYING,
                "apply-1",
            )
            _transition(
                connection,
                EpochTransitionState.APPLYING,
                EpochTransitionState.RECOVERY_REQUIRED,
                "recovery-1",
                authorization_id="operator-approval-1",
                authorization_digest=_DIGEST,
            )
            with pytest.raises(EpochControlStateError, match="Invalid epoch transition"):
                record_epoch_transition(
                    connection,
                    EpochTransitionState.RECOVERY_REQUIRED,
                    EpochTransition(
                        to_state=EpochTransitionState.APPLYING,
                        idempotency_key="automatic-retry",
                        actor_role="test_operator",
                        authorization_id="operator-approval-1",
                        authorization_digest=_DIGEST,
                    ),
                )
                transition = EpochTransition(
                    to_state=EpochTransitionState.FRESH_PREFLIGHT,
                    idempotency_key="reinspect-1",
                    actor_role="test_operator",
                    authorization_id="operator-approval-2",
                    authorization_digest=_DIGEST,
                    recovery_resolution_id="resolution-1",
                    database_identity_digest=_DIGEST,
                    plan_digest=_DIGEST,
                )
                with pytest.raises(EpochControlStateError, match="trusted verifier"):
                    record_epoch_transition(
                        connection,
                        EpochTransitionState.RECOVERY_REQUIRED,
                        transition,
                    )

                class ApprovedRecovery:
                    def verify(self, authorization_id, authorization_digest, purpose):
                        return (
                            authorization_id == "operator-approval-2"
                            and authorization_digest == _DIGEST
                            and purpose == "epoch_recovery"
                        )

                with pytest.raises(
                    EpochControlStateError,
                    match="match the database identity and plan digest",
                ):
                    record_epoch_transition(
                        connection,
                        EpochTransitionState.RECOVERY_REQUIRED,
                        EpochTransition(
                            to_state=EpochTransitionState.FRESH_PREFLIGHT,
                            idempotency_key="wrong-database-resolution",
                            actor_role="test_operator",
                            authorization_id="operator-approval-2",
                            authorization_digest=_DIGEST,
                            recovery_resolution_id="resolution-2",
                            database_identity_digest="b" * 64,
                            plan_digest=_DIGEST,
                        ),
                        authorization_verifier=ApprovedRecovery(),
                    )

                record_epoch_transition(
                    connection,
                    EpochTransitionState.RECOVERY_REQUIRED,
                    transition,
                    authorization_verifier=ApprovedRecovery(),
                )
                connection.commit()
                assert (
                    validate_epoch_audit(
                        connection,
                        authorization_verifier=ApprovedRecovery(),
                    )
                    is EpochTransitionState.FRESH_PREFLIGHT
                )
    finally:
        engine.dispose()


def test_epoch_audit_tampering_is_detected() -> None:
    engine = create_engine("sqlite:///:memory:")
    try:
        with engine.connect() as connection:
            _create_control(connection)
            _transition(
                connection,
                EpochTransitionState.UNCLASSIFIED,
                EpochTransitionState.FRESH_PREFLIGHT,
                "preflight-1",
            )
            connection.exec_driver_sql(
                "DROP TRIGGER qubira_epoch_audit_no_update"
            )
            connection.exec_driver_sql(
                "CREATE TRIGGER qubira_epoch_audit_no_update "
                "BEFORE UPDATE ON qubira_epoch_audit BEGIN SELECT 1; END"
            )
            connection.commit()
            connection.execute(
                EPOCH_AUDIT_TABLE.update().values(actor_role="tampered_operator")
            )
            connection.commit()
            with pytest.raises(EpochControlStateError, match="digest"):
                validate_epoch_audit(connection)
    finally:
        engine.dispose()


def test_epoch_control_bootstrap_refuses_any_existing_schema_object() -> None:
    engine = create_engine("sqlite:///:memory:")
    try:
        with engine.connect() as connection:
            connection.execute(text("CREATE TABLE preexisting_user_data (id INTEGER)"))
            connection.commit()
            with pytest.raises(EpochControlStateError, match="empty schema"):
                create_epoch_control_schema(connection)
    finally:
        engine.dispose()


def test_epoch_audit_is_append_only() -> None:
    engine = create_engine("sqlite:///:memory:")
    try:
        with engine.connect() as connection:
            _create_control(connection)
            _transition(
                connection,
                EpochTransitionState.UNCLASSIFIED,
                EpochTransitionState.FRESH_PREFLIGHT,
                "preflight-append-only",
            )
            with pytest.raises(IntegrityError, match="append-only"):
                connection.execute(
                    EPOCH_AUDIT_TABLE.update().values(to_state="verified")
                )
                connection.commit()
            connection.rollback()
            assert validate_epoch_audit(connection) is EpochTransitionState.FRESH_PREFLIGHT
    finally:
        engine.dispose()
