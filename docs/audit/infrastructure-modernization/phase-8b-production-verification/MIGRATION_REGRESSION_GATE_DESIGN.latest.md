# MIGRATION_REGRESSION_GATE_DESIGN — Stage 4A.8

> Design only. **No script or CI job is created in Stage 4A.** Implementation belongs to a subsequent Stage 4B after user authorization.

## Purpose

Fail CI when the active Prisma migration chain cannot be deployed against a fresh MariaDB 11 instance. This prevents the current failure (`P3018 / MariaDB 1060`) from ever re-occurring.

## Properties

1. Start a disposable MariaDB 11 container.
2. Confirm zero user tables in the target database.
3. Run the active Prisma migration chain (`prisma migrate deploy`).
4. Require first deploy exit code = 0.
5. Re-run `prisma migrate deploy` to verify idempotence.
6. Require second deploy exit code = 0.
7. Require zero rows in `_prisma_migrations` where `finished_at IS NULL`.
8. Compare resulting schema (information_schema) against the expected Prisma schema (every model table exists; every declared column exists).
9. Clean up all disposable resources (container, network, volume) on every path, including failure paths.
10. Fail CI on any migration error.
11. **Never** touch persistent credentials or persistent DB.

## Architecture

- Reuse the existing `stage3-fresh-db-probe.ps1` / `stage4a-replay.mjs` patterns (sidecar `node:22-bookworm-slim` for Prisma CLI + disposable MariaDB).
- New script: `scripts/audit/migration-regression-gate.mjs`.
- New CI job: `.github/workflows/ci.yml` → `migration-regression-gate` job.

### Script outline

```
1. Sanity: working directory is repo root; schema.prisma exists.
2. Generate unique run ID: phase8b-<UTC-timestamp>.
3. Create disposable network, volume.
4. Boot MariaDB 11; wait for healthy.
5. Confirm `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ?` = 0.
6. Inside sidecar container:
   a. Run `prisma migrate deploy` — capture exit code and full output.
   b. If exit != 0 → log artifact path, write FAIL result, teardown, exit non-zero.
7. Re-run `prisma migrate deploy` — capture exit code.
8. Query `_prisma_migrations` — assert zero rows with `finished_at IS NULL`.
9. For every model in schema.prisma:
   a. Assert `information_schema.tables WHERE table_schema = ? AND table_name = <model>` returns 1 row.
   b. Assert each declared column exists in information_schema.columns.
10. Teardown: remove container, network, volume.
11. Print PASS or FAIL summary with artifact paths.
12. Exit 0 on PASS, 1 on FAIL.
```

## Failure-mode coverage

| Failure | Detection |
|---|---|
| MariaDB boot fails | `waitHealthy` timeout; recorded as `boot_failed` |
| Empty-DB precondition fails | `table_count != 0` after reset; recorded as `not_empty` |
| First migrate deploy fails | `exit_code != 0`; artifact log captured |
| First migrate deploy succeeds but second fails | P3009 or hash mismatch; recorded as `not_idempotent` |
| Migration history has failed rows | `_prisma_migrations` query; recorded as `failed_migrations_present` |
| Schema drift between schema.prisma and applied schema | information_schema comparison; recorded as `schema_drift` |
| Cleanup failures | `try/finally` ensures container/network/volume are removed; failure logged but does not affect the gate's exit code (the gate already has its verdict by then) |

## Required CI integration

```yaml
migration-regression-gate:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
      with: { version: 10 }
    - uses: actions/setup-node@v4
      with: { node-version: 22 }
    - run: pnpm install --frozen-lockfile
    - run: docker --version
    - name: Migration regression gate
      env:
        CI: true
      run: node scripts/audit/migration-regression-gate.mjs
```

## Phase 8B scope compliance

- No persistent DB credentials.
- No persistent DB touch.
- All resources disposable and run-ID-tagged.
- No source code modified (gate script is NEW under `scripts/audit/`).

## Files that will be created in Stage 4B (NOT created in Stage 4A)

- `scripts/audit/migration-regression-gate.mjs` (NEW)
- `test/migration-regression-gate.test.mjs` (NEW — smoke test for the gate itself)
- `.github/workflows/ci.yml` edit (NEW job, no existing job removed)
- `docs/audit/infrastructure-modernization/phase-8b-production-verification/MIGRATION_REGRESSION_GATE.latest.md` (run report)

## Risk

- The gate itself must not be the source of false confidence. It must fail loudly when its prerequisites are missing (Docker not installed, MariaDB image not pullable, sidecar image not pullable).
- The gate must be hermetic: no network calls except image pulls.
- The gate must run in CI under a job that has Docker available (currently `ubuntu-latest` runners do).