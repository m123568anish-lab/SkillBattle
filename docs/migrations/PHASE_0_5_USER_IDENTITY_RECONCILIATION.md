# Phase 0.5 User Identity Reconciliation

## Summary

The target Neon branch contains 1,847 users versus 1,845 in the source SQLite dataset. Two additional target records are present, but the available evidence does not justify automatic merge logic.

## Source and target counts

| Source | Count |
| --- | ---: |
| SQLite users | 1,845 |
| Neon users | 1,847 |
| Clerk mappings | 68 |
| Neon identity mappings | 2 |

## Reconciliation table

| source_user_id | target_user_id | source_identity | target_identity | proposed_action | evidence | risk |
| --- | --- | --- | --- | --- | --- | --- |
| unknown | extra_target_user_1 | none observed | Neon mapping / no matching source UUID | MANUAL_REVIEW | No matching source UUID or normalized-email match found; active record and referenced app data exist | Medium |
| unknown | extra_target_user_2 | none observed | Neon mapping / no matching source UUID | MANUAL_REVIEW | No matching source UUID or normalized-email match found; active record and referenced app data exist | Medium |
| any source UUID match | matching target UUID | source UUID present | target UUID present | MATCH_EXISTING | Safe match on legitimate identifier which is not email-only | Low |
| source record with no valid target match | no target match | legacy / orphaned source record | none | CONFLICT | No direct target identity match; preserve source without automatic merge | Medium |

## Findings

- No automatic email-only merge is acceptable.
- The extra Neon users are not simple duplicates of source records.
- Each extra target user is active and not obviously disposable.
- Existing Neon identity mappings must not be overwritten or silently reassigned.
- The safe default is to preserve target records and require explicit review before any reconciliation change.

## Proposed policy

- `MATCH_EXISTING`: only when a stable, legitimate identity key matches (UUID or equivalent application identifier), not email alone.
- `MANUAL_REVIEW`: when the record is active, has identity data, or cannot be confidently matched.
- `CONFLICT`: when source and target identities diverge materially or require a policy decision.
- `INSERT`: not used in this phase for account reconciliation; creation or merge actions are explicitly closed.

## Important guardrail

This phase intentionally does not execute any user reconciliation action. The safety policy remains: preserve identity mappings, preserve application data, and do not merge accounts automatically.
