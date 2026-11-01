# Phase 8C — Persistent Metadata Transition Operator Checklist

Generated: 2026-07-11T10:07:57.695Z

Active baseline: `apps/api/prisma/migrations/20260711000000_squashed_baseline/`
Baseline SQL SHA-256: `002158c79fbace15308fb89caa3c65554489f10fa8ebc5622703f9953aee07d5`

## Procedure (read-only preflight)

This checklist is what the operator must complete and sign before the E1 procedure in
`docs/audit/infrastructure-modernization/phase-8b-production-verification/BASELINE_TRANSITION_OPERATOR_RUNBOOK.latest.md`
is executed. The actual transition is out-of-scope for Phase 8C.

- [ ] Step 1 — Operator/DBA explicit approval recorded _(BLOCKING)_
  - How: Operator confirms metadata-write authorisation out-of-band and records the approval ID in the transition log.
- [ ] Step 2 — Maintenance window declared and concurrent deploy processes stopped _(BLOCKING)_
  - How: Stop CI deploy jobs and release pipelines for the database host.
- [ ] Step 3 — Restorable backup + _prisma_migrations export captured _(BLOCKING)_
  - How: mysqldump + separate dump of `_prisma_migrations` table; verify restore in a sandbox.
- [ ] Step 4 — Active baseline SQL hash matches release artifact _(BLOCKING)_
  - How: Expected hash: 002158c79fbace15308fb89caa3c65554489f10fa8ebc5622703f9953aee07d5. Source: apps/api/prisma/migrations/20260711000000_squashed_baseline/migration.sql.
- [ ] Step 5 — Read-only `prisma migrate diff` from target DB to release datamodel _(BLOCKING)_
  - How: pnpm --filter api exec prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script > /tmp/diff.sql
- [ ] Step 6 — Classify every difference — only the two retained DEFAULT 'GLOBAL' clauses are accepted _(BLOCKING)_
  - How: form_contract_versions.scope_key and official_permissions.scope_key are the only expected differences. Any additional delta is a stop condition.
- [ ] Step 7 — Query migration status; select E1/E2/E3 branch _(BLOCKING)_
  - How: pnpm migrate:status. If active failed row count == 0 → E1/E3. Else → E2.
- [ ] Step 8 — Run E1 branch commands in order: status, resolve --applied, status, deploy, deploy _(BLOCKING)_
  - How: Documented in BASELINE_TRANSITION_OPERATOR_RUNBOOK.latest.md §E1/E3.
- [ ] Step 9 — Re-run verification query set to confirm no application-schema or row mutation _(BLOCKING)_
  - How: Compare structure fingerprint and metadata fingerprint before/after the transition.

## Refusal rules

- Never place automatic `migrate resolve` logic in the API entrypoint.
- Never delete legacy `_prisma_migrations` rows.
- Never apply the baseline SQL directly to an existing populated schema.
- Never perform the transition without explicit operator/DBA approval recorded above.

## Expected outcome (post-transition)

- application-table structure hash unchanged
- exactly one successful baseline row added
- all legacy metadata rows preserved
- `migrate:status` exits 0, `migrate deploy` exits 0 twice
- two `DEFAULT 'GLOBAL'` clauses retained on scope_key columns
