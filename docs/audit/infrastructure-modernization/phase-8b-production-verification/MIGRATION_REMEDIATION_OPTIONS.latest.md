# MIGRATION_REMEDIATION_OPTIONS — Stage 4A.6

| Option | Concept | Recommendation |
|---|---|---|
| A | Clean baseline reset (one new migration = current schema; old chain archived; existing DBs get one-time `migrate resolve --applied` after parity check) | **RECOMMENDED** |
| B | Restore historical init_schema (revert init_schema to a non-existent "original") | **REJECTED** — no recoverable history in git |
| C | Guard all UNGUARDED_DUPLICATE operations with `IF NOT EXISTS` / `IF EXISTS` | **ACCEPTABLE SECONDARY** — does not address the logical inconsistency |
| D | Entrypoint auto-resolve / skip | **REJECTED** — hides defects, unsafe for legal-system production |
| E | Fresh-install bootstrap outside Prisma (canonical schema dump + mark all as applied) | **ACCEPTABLE ALTERNATIVE** — same outcome as A but heavier |

## Detailed evaluation

### OPTION A — Clean baseline reset (RECOMMENDED)

| Dimension | Assessment |
|---|---|
| Concept | Archive current migration history outside the active Prisma migration path. Generate a new baseline (single migration) that represents the approved current schema. Fresh DBs apply the new baseline. Existing DBs undergo read-only schema-parity validation and then a controlled, operator-authorized `migrate resolve --applied` for the new baseline row. |
| Files affected | `apps/api/prisma/migrations/<TIMESTAMP>_baseline_init/migration.sql` (NEW baseline = current schema); `apps/api/prisma/migrations/<TIMESTAMP>_baseline_lock/migration.sql` (optional guard); `docs/audit/infrastructure-modernization/phase-8b-production-verification/MIGRATION_REMEDIATION_PLAN.latest.md`; `README.md` operator procedure addendum; `.github/workflows/ci.yml` migration-regression-gate job |
| Persistent DB action | One-time, operator-authorized `prisma migrate resolve --applied <baseline>` after schema-parity validation. **NOT** executed in Phase 8B. |
| Migration metadata action | Reset `_prisma_migrations` rows for existing DBs by re-resolving against the new baseline. |
| Fresh DB result | PASS — single baseline migration produces current schema in one step. |
| Existing DB result | PASS — schema already matches new baseline (verified via read-only parity check); one-time resolve marks the new baseline as applied. |
| Data-loss risk | None on schema; metadata is regenerated, not deleted. |
| Checksum risk | Low — old migration checksums are removed from active path; new baseline has one canonical checksum. |
| Operational complexity | Medium — requires operator procedure document + one-time resolve. |
| Rollback | Re-archive new baseline; restore old chain from external archive. |
| Supported states | A, B, C, D |

### OPTION B — Restore historical init_schema (REJECTED)

| Dimension | Assessment |
|---|---|
| Concept | Reconstruct the original init_schema (without the retroactively-added columns). Remove from init every object owned by a later migration. Keep later additive migrations unchanged. |
| Files affected | `apps/api/prisma/migrations/20260615000000_init_schema/migration.sql` (REVERTED — UNGUARDED_DUPLICATE columns removed) |
| Fresh DB result | Depends on what "original" init_schema contained. **There is no recoverable original** because git history contains exactly one version of init_schema. |
| Existing DB result | FAIL — existing DBs already have the expanded init_schema columns. Removing them from the migration file does not retroactively remove them from the DB. Prisma will report drift. |
| Data-loss risk | HIGH on schema (existing DBs already include the columns). |
| Checksum risk | HIGH — forges an "original" init_schema checksum that was never committed. |
| Operational complexity | High (fabricating a historical schema). |
| Rollback | Cannot roll back — once the init_schema file is rewritten, the historical content is lost. |
| Recommendation rationale | **Rejected**. Git provenance (Stage 4A.4) shows there is no recoverable prior content. Any "original" must be fabricated. Fabricated history is not auditable and would silently re-introduce the same risk on the next schema change. |

### OPTION C — Make historical migrations conditional (ACCEPTABLE SECONDARY)

| Dimension | Assessment |
|---|---|
| Concept | Wrap each UNGUARDED_DUPLICATE operation with `IF NOT EXISTS` / `IF EXISTS` so the migration is idempotent against a schema that already has the columns/indexes. |
| Files affected | The four UNGUARDED_DUPLICATE migrations: `20260616000000_add_officials_role`, `20260616010000_add_official_credentials`, `20260616020000_add_template_owner_official`, `20260617010000_add_soft_delete_to_case_offenses_and_evidence` |
| Persistent DB action | None. |
| Migration metadata action | None. |
| Fresh DB result | PASS — guarded operations are no-ops against init_schema's expanded columns. |
| Existing DB result | PASS — guarded operations are no-ops against any existing schema. |
| Data-loss risk | None. |
| Checksum risk | **Medium** — Prisma flags checksum changes for already-applied migrations. Environments with these migrations in `_prisma_migrations` would need a `migrate resolve` (forbidden against persistent DB). |
| Operational complexity | Low — surgical SQL edits. |
| Rollback | Revert the guards; replay against fresh DB. |
| Recommendation rationale | **Acceptable secondary** but does not address the deeper issue: the migration history is logically inconsistent (six migrations now do nothing useful because their work was already done by init_schema). It is a tactical fix, not a structural fix. Use only if Option A is forbidden by user policy. |

### OPTION D — Entrypoint auto-resolve / skip (REJECTED)

| Dimension | Assessment |
|---|---|
| Concept | Modify `docker/api-entrypoint.sh` to detect existing schema objects and automatically run `prisma migrate resolve` to skip the failed migration. |
| Files affected | `docker/api-entrypoint.sh` |
| Persistent DB action | **YES — auto-modifies persistent DB** based on detection heuristics. |
| Migration metadata action | Auto-resolves failed migrations based on schema state. |
| Fresh DB result | Does not apply — fresh DBs have no failed migrations to skip. |
| Existing DB result | **UNSAFE** — auto-resolve can mark a migration as applied when it has not been; behavior varies per environment; audit trail is corrupted. |
| Data-loss risk | MEDIUM — wrong resolve marks a migration as applied when objects are not actually present; subsequent deploys may then drop or alter objects based on the lie. |
| Checksum risk | HIGH — silent checksum deviations from auto-resolve. |
| Recommendation rationale | **Rejected**. Hides migration-history defects behind environment-specific heuristics. Unsafe for a legal-system production deployment that must produce a defensible audit trail. Specifically forbidden by Phase 8A operating decision ("`prisma migrate resolve` against any persistent database is forbidden"). |

### OPTION E — Fresh-install bootstrap outside Prisma (ACCEPTABLE ALTERNATIVE)

| Dimension | Assessment |
|---|---|
| Concept | Import a schema dump (mysqldump or `prisma db pull` artifact) directly into a fresh DB. Then run `prisma migrate resolve --applied` for every historical migration to mark them as applied. Continue with future Prisma migrations. |
| Files affected | `scripts/db-bootstrap.sh` (NEW); `apps/api/prisma/schema.sql` (NEW canonical schema dump); `.github/workflows/ci.yml` bootstrap job |
| Persistent DB action | One-time schema import (if dump replaces existing DB) OR one-time `migrate resolve` (if existing DB already has the schema). |
| Migration metadata action | Mark all current migrations as applied in `_prisma_migrations`. |
| Fresh DB result | PASS — schema import + resolve marks the chain as applied; future migrations work normally. |
| Existing DB result | PASS — schema already matches; resolve marks the chain as applied. |
| Data-loss risk | MEDIUM-HIGH — if a fresh-DB bootstrap ever points at an existing DB, the dump import will overwrite it. Operator procedure MUST guard against this. |
| Checksum risk | Low (the new chain reuses current checksums). |
| Operational complexity | Medium-High — requires a canonical schema dump artifact, versioned alongside code. |
| Rollback | Re-import dump; re-resolve. |
| Recommendation rationale | **Acceptable alternative** — effectively the same outcome as Option A but heavier operational footprint (must maintain a canonical schema dump). Choose only if Option A is forbidden by user policy. |

## Default recommendation

**OPTION A — Clean baseline reset.**

Reasons:

1. Option A produces a logically consistent migration history with one canonical baseline.
2. Option A supports all four environment states (A/B/C/D) without fabricating history or relying on hidden heuristics.
3. Option A minimizes per-deployment risk: fresh DBs succeed in a single migration; existing DBs require exactly one operator-authorized action.
4. Option A preserves the principle that migrations should be immutable once committed; the new baseline is a new migration, not an edit of an old one.
5. Option A's data-loss risk is bounded (zero on schema; zero on data because the operator resolve marks the baseline as applied without modifying schema).

## Persistent DB actions proposed (NOT executed in Phase 8B)

| Action | Trigger | Operator | Audit |
|---|---|---|---|
| `prisma migrate resolve --applied <baseline>` on persistent user DB | After read-only schema-parity check passes | User-authorized DBA | Logged in `_prisma_migrations` + operator logbook |