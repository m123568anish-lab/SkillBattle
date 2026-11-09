# Coding Practice Audit

## Scope and active request flow

- `/practice/coding` is implemented in `frontend/src/app/practice/coding/page.tsx`. It fetches the authenticated catalog from `GET /api/v1/practice/problems`, retrieves selected details from `GET /api/v1/practice/problems/{id}`, and calls the existing compiler run and submit endpoints.
- `/practice/coding/[id]` redirects to the query-parameter workspace at `/practice/coding?problem={id}`; it is not a separate detail implementation.
- The list and detail endpoints are in `backend/app/modules/practice/router.py`; they use the async session and `Problem`, `ProblemTag`, `ProblemTestCase`, and `ProblemStarterCode` records.
- `backend/app/models/problem.py` stores a title, slug, difficulty, one category, statement/formats/constraints, and relationships. Tags are stored separately. It has no source catalog ID, source title, or import provenance field.
- `backend/app/modules/problem/importer.py` only reads JSON; no catalog parsing, source-title resolution, or import provenance handling is implemented there.
- Code submissions are handled by the compiler module and persist `CodeSubmission` records. The practice list determines solved/attempted status from those records. The detail endpoint returns only non-hidden test cases, while compiler submission evaluates hidden test cases.

## Findings

1. The coding catalog currently renders `Problem.title` verbatim. It does not guard against titles that are import labels or internal identifiers.
2. The catalog searches only `Problem.title`; it does not search the category or verified `ProblemTag` values.
3. Category filtering supports one category value and the response exposes categories, not a topic taxonomy. The data model supports multiple topic tags separately, but there is no normalization layer.
4. The catalog is a card grid. It shows category and ID, but not verified tags or an explicit unsolved/attempted state. Pagination and solved filtering already exist.
5. Problem detail content, input/output format, constraints, examples, language selection, run, and submit are already wired. The route itself is a query-driven workspace; no separate detail page is active.
6. The problem model/schema contains no import-source metadata, so code cannot reliably reconstruct an official source title from an internal catalog ID. A title must not be inferred from an ID or replaced with a fabricated title.
7. Automated practice tests create synthetic “Catalog page …” records to test pagination; those are test fixtures and not evidence that the production catalog has those titles.
8. The working tree contains unrelated database readiness/migration work. It must remain untouched by the coding-practice changes.

## Data verification required before title repair

Production inventory was run read-only against the Neon `production` branch (`green-cake-01021519`, database `neondb`). No database records were changed.

- There are 624 total problem rows, of which 588 are active.
- All 588 active rows have a non-empty title, description, input/output format, constraints, and a standard `Easy` difficulty. These non-empty values are not evidence of usable problem content.
- 552 active titles use the `Catalog page <short-id> <index>` import-label pattern. The other 36 use `Daily arrays <short-id>`.
- The 552 catalog-label records share the placeholder statement `Return the requested value.`; the other 36 share `Return a value.`. There are only two distinct active statements across all 588 active records.
- All active records have category `Arrays`, and none has a `problem_tags` row.
- Every active record has a unique title, so the current defect is not duplicate display names.
- The production `problems` schema has no source catalog ID/title or import-provenance columns. The inspected importer only parses JSON and does not resolve source metadata.
- No local problem/catalog JSON, CSV, or YAML source file was found by the repository inventory search; there is no authoritative source available here to reconstruct the missing records.

The database does not contain enough information to determine genuine problem titles, verified topics, or usable statements. Do not repair these records by deriving a title from the generated slug, short ID, category, or placeholder statement. Preserve all IDs, records, and submission relationships; surface an explicit metadata-quality warning and require authoritative source data before any repair or replacement. The list/detail UI should not present these placeholders as valid coding challenges or allow submissions against them.

## Corrective implementation

- Add shared title/statement quality checks and response warnings; hide internal placeholder titles without changing stored names or IDs.
- Extend catalog search across usable titles, categories, and tags; add topic filtering, difficulty sorting, readiness counts, and progress filters while retaining pagination.
- Replace the card grid with a compact responsive table that preserves IDs and progress, flags records needing repair, and disables solve actions for unusable content.
- Preserve the detail workspace and compiler/evaluation path for usable problems. Detail and battle views warn on unusable records, and submission rejects them server-side. Hidden tests remain excluded from public detail responses.
- Define "unsolved" as any problem without an accepted submission, including problems with failed attempts.
- Calculate solved/attempted completion metrics only from active problems that pass the content-readiness check.
- Add backend regression coverage for placeholder handling, title classification, tag search/filter, sorting, readiness, submission rejection, and solved/unsolved progress.

Backend practice tests passed (`4 passed`); frontend TypeScript checking, targeted ESLint, and production build passed. No production data was changed. A real submission/browser flow was not run because the active production catalog contains only placeholder statements and no verified test problems to solve.
