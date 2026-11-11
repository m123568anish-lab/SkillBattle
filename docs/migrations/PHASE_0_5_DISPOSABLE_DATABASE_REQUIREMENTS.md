# Phase 0.5 Disposable Database Requirements

## Objective

A disposable PostgreSQL target is required before any migration dry run, schema preparation, or data import. The target must be separate from production, explicitly authorized, empty, and connected through a direct unpooled URL.

## Required configuration

- Separate from production Neon.
- Empty before use.
- Direct PostgreSQL connection (not pooled). 
- SSL enabled.
- Database and migration permissions confirmed.
- No production credentials copied into test configuration.
- `MIGRATION_DATABASE_URL` must point to the disposable target, not production.

## Required environment variables

At minimum, the environment should provide the following values without exposing secret material in this report:

- `QUBIRA_TEST_POSTGRESQL_URL`
- `QUBIRA_EPOCH_POSTGRESQL_TEST=1`
- `QUBIRA_TEST_MODE=1`
- `MIGRATION_DATABASE_URL`
- `DATABASE_URL` for the disposable target only when explicitly required by the test harness

These values must be authoritatively scoped to a disposable branch or database, not a production branch.

## Validation that must be met before migration dry run

1. Database is explicitly empty or known-safe for rebuild.
2. Connection is direct/unpooled and not a pooler endpoint.
3. Migration permissions are confirmed.
4. SSL is enabled.
5. The target is separate from production and not shared with live records.
6. The migration coordinator can identify the target as disposable.

## Current status

No safe disposable PostgreSQL target was explicitly authorized or validated during this phase. As a result, migration activation remains closed.

## Redaction note

This document intentionally leaves connection strings and secrets redacted.
