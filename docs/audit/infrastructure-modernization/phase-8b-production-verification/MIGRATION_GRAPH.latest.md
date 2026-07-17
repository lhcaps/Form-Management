# Phase 8B — Stage 2 — Static Migration Graph

**Run ID**: `phase8b-20260711-0100`
**Captured**: 2026-07-11T01:04 (UTC+7)
**Dir**: `apps/api/prisma/migrations/`

## Prisma lockfile

`apps/api/prisma/migrations/migration_lock.toml` is **absent**. Prisma 6+ allows omission; if a provider-specific default is required, Prisma infers `mysql` from the datasource provider `mysql` in `apps/api/prisma/schema.prisma`. **No action.**

## Legacy DB init (NOT in prisma deploy path)

`database/` and `infra/database/` contain raw SQL files. These are mounted by `infra/docker-compose.dev.yml` into `/docker-entrypoint-initdb.d/` and **only run on the first boot of an empty MariaDB volume**. They are **not** invoked by `prisma migrate deploy`. They are independent of the migration graph below.

| File | Effect |
|---|---|
| `infra/database/001_init_utf8mb4.sql` | `ALTER DATABASE quanlyvks CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci` |
| `database/002_fix_people_nationality_utf8.sql` | Backfills `people.nationality = 'Việt Nam'`. Redundant after `20260617110000_fix_vietnamese_column_defaults`. |
| `database/003_seed_template_versions_mvp.sql` | Inserts `template_versions` rows for 5 demo templates. Idempotent via `ON DUPLICATE KEY UPDATE`. |

## Migration inventory (13 migrations, chronological)

| # | Directory | Lines | New tables | New columns | Indexes | FKs | Insert | Idempotent guards |
|--:|---|---:|---|---:|---:|---:|---|---|
| 1 | 20260615000000_init_schema | 814 | 31 (incl. auth_sessions) | 0 | 0 | 42 | 0 | none |
| 2 | 20260616000000_add_officials_role | 24 | 0 | 1 | 0 | 0 | 0 | none |
| 3 | 20260616005000_create_auth_sessions | 21 | 1 (auth_sessions, guard) | 0 | 0 | 0 | 0 | IF NOT EXISTS |
| 4 | 20260616010000_add_official_credentials | 25 | 0 | 2 | 1 | 0 | 0 | none |
| 5 | 20260616020000_add_template_owner_official | 37 | 0 | 2 | 2 | 2 | 0 | none |
| 6 | 20260616_add_auth_sessions | 23 | 1 (auth_sessions, guard) | 0 | 0 | 0 | 0 | IF NOT EXISTS |
| 7 | 20260617010000_add_soft_delete_to_case_offenses_and_evidence | 20 | 0 | 2 | 2 | 0 | 0 | none |
| 8 | 20260617110000_fix_vietnamese_column_defaults | 12 | 0 | 0 | 0 | 0 | 0 | MODIFY COLUMN |
| 9 | 20260620150000_add_form_contract_platform_v2 | 114 | 5 | 0 | 0 | 0 | 1 | none |
| 10 | 20260620170000_enforce_form_contract_scope_uniqueness | 26 | 0 | 2 | 2 (DROP+ADD) | 0 | 0 | none |
| 11 | 20260622000000_add_clerk_auth_identities | 27 | 1 (auth_identities, guard) | 0 | 0 | 0 | 0 | IF NOT EXISTS |
| 12 | 20260702000000_add_auth_identity_audit_logs | 31 | 1 (auth_identity_audit_logs, guard) | 0 | 0 | 0 | 0 | IF NOT EXISTS |
| 13 | 20260702_generated_document_audit_logs | 88 | 1 (generated_document_audit_logs) | 0 | 9 | 5 | 0 | none |

## Duplicate CREATE TABLE evidence

The only duplicate: **`auth_sessions`** is created 3 times.

| Migration | Guarded? |
|---|---|
| 20260615000000_init_schema | **No** (raw CREATE TABLE). Creates it as part of init. |
| 20260616005000_create_auth_sessions | **Yes** (IF NOT EXISTS). No-op on a DB that has auth_sessions from init. |
| 20260616_add_auth_sessions | **Yes** (IF NOT EXISTS). No-op on the same DB. |

This **does not produce P3018 / 1060 on a fresh DB**. The two later attempts are guarded no-ops.

## Entry point verification

`docker/api-entrypoint.sh`:

```sh
set -eu
# ... wait for MariaDB ping via mysqladmin ...
cd /app/apps/api
pnpm exec prisma migrate deploy
# SEED_DATA gate: exactly true / false / '', else exit 2.
exec node dist/src/main.js
```

- `set -eu` (fail-closed).
- Migration runs from `/app/apps/api` with the schema baked into the image at COPY `--from=builder`.
- Seed is gated and never runs by default.
- No `CREATE DATABASE`, no `|| true`, no fallback paths.

## Entrypoint hypothesis: REJECTED pre-Stage 3

The entrypoint does not exhibit a code defect relative to the migration set.

## Hypotheses carried into Stage 3 (fresh disposable DB probe)

| ID | Claim | Static-graph verdict |
|---|---|---|
| H-FRESH-OK | prisma migrate deploy against an empty DB applies all 13 migrations, exits 0, schema matches `schema.prisma` | PLAUSIBLE — expected to reproduce SUCCEED |
| H-DRIFT-1060 | P3018 / 1060 is caused by drift on the persistent DB, not the migration code | PLAUSIBLE — static graph produces no 1060 on fresh DB |
| H-INIT-MODIFIED | init_schema was retroactively modified to include auth_sessions, causing collision | REJECTED — init_schema is internally consistent with live schema.prisma |
| H-ENTRYPOINT-DEFECT | entrypoint uses wrong migration root or missing seed guard | REJECTED — `set -eu`, schema baked into image, SEED_DATA fail-closed |
| H-PROBE-DEFECT | external probe ran prisma against an already-populated DB and reported P3018 as a fresh-DB failure | PLAUSIBLE — requires disposable DB probe |

## Lockfile note for Stage 3

The disposable DB will use `MARIADB_IMAGE=mariadb:11` (matching `docker-compose.prod.yml`). The probe will:
1. Start MariaDB.
2. Wait for healthy.
3. Confirm `information_schema.schemata` for the target DB contains zero tables from our schema.
4. Run `prisma migrate deploy` against the empty schema.
5. Read `_prisma_migrations`.
6. Capture exact exit code and full output.
7. Re-run `prisma migrate deploy` to verify idempotence.
8. Read `information_schema.tables` to confirm 39 tables present (matches static graph).
9. Drop volume and clean up.

If SUCCEEDS, CRIT-04 closes to `MIGRATION_CODE_DEFECT = FALSE`; persistent-DB drift remains the only plausible source of P3018.
If FAILS, Stage 4 (remediation gate) activates.