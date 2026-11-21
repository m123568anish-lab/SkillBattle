# Render PostgreSQL Schema Evidence Collection Runbook

This runbook is for an authorized operator with read-only access to the affected Render PostgreSQL database. It must be executed separately from the application host. Do not provide credentials, connection strings, row data, tokens, or personal data to the incident channel.

## Safety gate

- Use a read-only database role or an explicit read-only transaction.
- Do not run `CREATE`, `ALTER`, `DROP`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `GRANT`, `REVOKE`, `VACUUM`, `ANALYZE`, `SET ROLE`, `stamp`, or migration commands.
- Do not export table rows. The requested evidence is catalog metadata only.
- Capture the Render deployed commit SHA separately from Render's deployment metadata.
- Redact hostnames, usernames, database names, schema names if organizationally sensitive, and all credential-bearing values before sharing.

## 1. Engine and connection identity

Run in a read-only transaction:

```sql
BEGIN READ ONLY;

SELECT
    version() AS server_version,
    current_database() AS database_name,
    current_user AS database_role,
    session_user,
    current_schema() AS current_schema,
    current_setting('server_version_num') AS server_version_num,
    inet_server_addr()::text AS server_address,
    inet_server_port() AS server_port,
    pg_backend_pid() AS backend_pid;

SHOW search_path;
```

The operator should redact address, role, and database identifiers as required, but retain PostgreSQL major/minor version and whether the server is PostgreSQL 18.6.

## 2. Recorded Alembic revision

```sql
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name = 'alembic_version';

SELECT version_num
FROM public.alembic_version;
```

If the revision table is not in `public`, repeat the second query using the schema returned by the first query. Do not infer a revision from table shape. Record row count and revision value only.

## 3. Sanitized schema inventory

```sql
SELECT table_schema, table_name, table_type
FROM information_schema.tables
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name;

SELECT table_schema, table_name, column_name, ordinal_position,
       data_type, udt_schema, udt_name, is_nullable,
       column_default, character_maximum_length, numeric_precision
FROM information_schema.columns
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name, ordinal_position;

SELECT table_schema, table_name, constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name, constraint_name;

SELECT table_schema, table_name, constraint_name, column_name,
       ordinal_position, position_in_unique_constraint
FROM information_schema.key_column_usage
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name, constraint_name, ordinal_position;
```

`column_default` may contain application-specific literals. Redact values, while preserving whether a default exists and its normalized expression class.

## 4. Required PostgreSQL catalog definitions

These catalog queries are read-only. They require ordinary catalog visibility for objects owned by the application role. If rows are hidden by permissions, record `NOT AVAILABLE` rather than escalating privileges without approval.

```sql
SELECT n.nspname AS schema_name, c.relname AS table_name,
       i.relname AS index_name,
       pg_get_indexdef(i.oid) AS index_definition,
       ix.indisunique, ix.indisprimary, ix.indisvalid,
       ix.indisready, ix.indislive
FROM pg_index ix
JOIN pg_class c ON c.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, c.relname, i.relname;

SELECT n.nspname AS schema_name, c.relname AS table_name,
       con.conname AS constraint_name,
       con.contype,
       con.convalidated,
       pg_get_constraintdef(con.oid, true) AS definition
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, c.relname, con.conname;

SELECT n.nspname AS schema_name, c.relname AS table_name,
       t.tgname AS trigger_name,
       pg_get_triggerdef(t.oid, true) AS definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE NOT t.tgisinternal
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, c.relname, t.tgname;

SELECT n.nspname AS schema_name, c.relname AS sequence_name,
       format_type(q.seqtypid, NULL) AS data_type,
       q.seqstart, q.seqmin, q.seqmax, q.seqincrement,
       q.seqcache, q.seqcycle,
       owner_table.relname AS owned_by_table,
       owner_column.attname AS owned_by_column
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_sequence q ON q.seqrelid = c.oid
LEFT JOIN pg_depend d ON d.objid = c.oid
  AND d.classid = 'pg_class'::regclass
  AND d.refclassid = 'pg_class'::regclass
  AND d.deptype IN ('a', 'i')
LEFT JOIN pg_class owner_table ON owner_table.oid = d.refobjid
LEFT JOIN pg_attribute owner_column ON owner_column.attrelid = d.refobjid
  AND owner_column.attnum = d.refobjsubid
WHERE c.relkind = 'S'
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, c.relname;
```

The following require elevated catalog visibility in some installations: `pg_authid`, role membership, ownership of objects outside the application schema, and default privileges belonging to other roles. Do not request superuser access for this incident; mark those fields unavailable.

## 5. Views, materialized views, policies, and row security

```sql
SELECT schemaname, viewname, definition
FROM pg_catalog.pg_views
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, viewname;

SELECT schemaname, matviewname, definition
FROM pg_catalog.pg_matviews
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, matviewname;

SELECT schemaname, tablename, policyname, permissive, roles,
       cmd, qual, with_check
FROM pg_catalog.pg_policies
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename, policyname;

SELECT n.nspname AS schema_name, c.relname AS table_name,
       c.relrowsecurity AS row_security_enabled,
       c.relforcerowsecurity AS row_security_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind IN ('r', 'p')
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, c.relname;
```

## 6. Fingerprint and comparison package

The operator should provide a sanitized JSON package containing:

1. Engine version and schema/search path result.
2. Exactly one Alembic revision row.
3. The complete catalog results above, with definitions normalized but not deleted.
4. A SHA-256 fingerprint computed over the canonicalized JSON bytes.
5. Render deployed commit SHA.
6. The application repository commit used for comparison.
7. The full sanitized `schema_differences` array, including `object_id`, `expected`, and `observed` fields.

No production migration is implied by this collection. The migration owner must compare the package with the repository target and classify every difference before any authorization decision.

## Stop conditions

Stop and report `UNKNOWN` if the role cannot see a required catalog object, if more than one Alembic revision row exists, if the schema/search path is ambiguous, or if the deployed commit cannot be established. Do not compensate with `create_all()`, `stamp()`, manual DDL, or a broader database role.

End the read-only transaction with:

```sql
ROLLBACK;
```
