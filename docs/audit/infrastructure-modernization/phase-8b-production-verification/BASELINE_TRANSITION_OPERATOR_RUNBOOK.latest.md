# Phase 8B - Baseline transition operator runbook

## Scope

This runbook is for a future, explicitly authorized transition of an existing database after the active squashed baseline is accepted and deployed with the application code. Phase 8B does **not** execute these write commands against the persistent database.

Never place automatic `migrate resolve` logic in the API entrypoint. Never delete legacy `_prisma_migrations` rows. Never apply the baseline SQL directly to an existing populated schema.

## Required preconditions

1. Obtain explicit operator/DBA approval for a metadata write.
2. Enter a maintenance window and stop concurrent deploy processes.
3. Take a restorable database backup and a separate export of `_prisma_migrations`.
4. Confirm the code release contains exactly one active baseline migration and that its SQL hash matches the approved candidate.
5. Run read-only `prisma migrate diff` from the target database to the release datamodel.
6. Classify every difference. For the currently inspected persistent DB, the only accepted differences are the two retained `DEFAULT 'GLOBAL'` clauses on the `scope_key` columns. Any additional difference is a stop condition.
7. Query migration status fields only. If an active failed row exists, use the E2 branch; otherwise use E1/E3.

Use the repository's root-env wrapper pattern from `apps/api`; do not rely on the package-local `.env` that selected `sha256_password` during the audit.

## E1/E3 - No active failed migration

With `<ACTIVE_BASELINE>` replaced by the exact active directory name:

```powershell
pnpm migrate:status
node --env-file=../../.env node_modules/prisma/build/index.js migrate resolve --applied <ACTIVE_BASELINE>
pnpm migrate:status
node --env-file=../../.env node_modules/prisma/build/index.js migrate deploy
node --env-file=../../.env node_modules/prisma/build/index.js migrate deploy
```

Expected behavior:

- Initial status may exit `1` because the active baseline is not yet represented in metadata.
- Resolve exits `0` and adds one successful baseline row.
- All legacy metadata rows remain present.
- Final status and both deploy commands exit `0`.
- No application table, column, index, foreign key, default, or application row changes.

If a successful `<ACTIVE_BASELINE>` row already exists, do not repeat `resolve --applied`; verify status and deploy only.

## E2 - Active failed legacy migration

Do not resolve the baseline first and continue. The disposable proof showed that this leaves deploy blocked by `P3009`.

Run, in this order:

```powershell
node --env-file=../../.env node_modules/prisma/build/index.js migrate resolve --rolled-back <FAILED_LEGACY_MIGRATION>
node --env-file=../../.env node_modules/prisma/build/index.js migrate resolve --applied <ACTIVE_BASELINE>
pnpm migrate:status
node --env-file=../../.env node_modules/prisma/build/index.js migrate deploy
node --env-file=../../.env node_modules/prisma/build/index.js migrate deploy
```

Expected behavior:

- The failed row receives `rolled_back_at`; it is not deleted.
- The baseline receives one successful row.
- Status and both deploy commands exit `0`.
- No application-schema or application-data mutation occurs.

If more than one active failed row exists, stop and audit each row independently. The Phase 8B simulation proves one representative Stage 3 failure, not an arbitrary multi-failure history.

## Verification query set

Use metadata-only/read-only queries before and after the transition to compare:

- MariaDB version and database name;
- tables, columns, defaults, indexes, foreign keys, charset, and collation;
- `_prisma_migrations` name, checksum, `started_at`, `finished_at`, `rolled_back_at`, and `applied_steps_count`;
- active failed row count.

The application-structure fingerprint must be identical. The only expected metadata delta is the baseline row, plus `rolled_back_at` for the explicitly selected failed row in E2.

## Abort and recovery

Abort immediately if:

- schema diff contains anything beyond an operator-accepted difference;
- baseline checksum does not match the release artifact;
- a new failed row appears;
- status or either deploy exits non-zero after the documented resolution;
- application structure changes;
- the backup cannot be verified.

On abort, stop deployment and restore from the verified database backup under DBA control. Do not improvise by deleting `_prisma_migrations` rows, editing checksums, auto-resolving from the entrypoint, or applying baseline DDL to the populated schema.

## Current persistent state

- Filesystem/metadata names aligned: 13 / 13.
- Metadata rows: 15, including two historical rolled-back attempts followed by successful rows.
- Active failed rows: 0.
- Applicable procedure if approved later: E1.
- Persistent transition performed by Codex: **NO**.
