# MIGRATION_ENVIRONMENT_COMPATIBILITY — Stage 4A.5

| State | Description | Currently observable? |
|---|---|---|
| **A — Brand-new database** | Zero tables, zero `_prisma_migrations` rows; must reach current schema from scratch. | **YES** — Stage 3 reproduced this exactly. 0 → 32 tables after `init_schema`. |
| **B — Existing database with legacy init** | Original init did NOT contain the retroactively-added fields; the additive migrations may already be marked applied. | **NO** (not in this repo) — git shows only one version of init_schema, so no persistent environment can have a "legacy" init in this codebase. |
| **C — Existing database with current expanded init** | Current schema is in place; the failed migration is recorded with `finished_at = NULL`. | **YES** — Stage 3 left exactly this state in the disposable DB after the first failed `prisma migrate deploy`. |
| **D — Existing database with schema parity but incomplete migration metadata** | Schema objects exist; `_prisma_migrations` does not fully describe them (e.g. `_prisma_migrations` truncated, but tables present). | **NOT OBSERVED** — requires external production artifact to confirm. |

## Compatibility of each remediation option (summary; see MIGRATION_REMEDIATION_OPTIONS for details)

| Option | Supports A | Supports B | Supports C | Supports D | Persistent DB action |
|---|---|---|---|---|---|
| A. Clean baseline reset | ✅ | ⚠️ (one-time operator step) | ⚠️ (one-time operator step) | ⚠️ (one-time operator step) | One-time `migrate resolve --applied` for existing DBs only |
| B. Restore historical init | ❌ (no recoverable history) | ❌ | ❌ | ❌ | None |
| C. Make historical migrations conditional | ✅ | ✅ | ✅ (no-op) | ✅ (no-op) | None |
| D. Entrypoint auto-resolve | **REJECTED** | — | — | — | Mutates persistent DB |
| E. Fresh-install bootstrap outside Prisma | ✅ (effectively same as A) | ⚠️ (one-time operator step) | ⚠️ (one-time operator step) | ⚠️ (one-time operator step) | One-time external import |

## Persistent DB authorization

Per operating decisions: **persistent user databases are strictly read-only**. Any remediation that proposes a write action against a persistent DB requires explicit user authorization and must be executed via the approved operator procedure (Option A or E). No write against a persistent DB is permitted in Stage 4A.

## State A — Detailed characterization

- MariaDB container started with empty `/var/lib/mysql`.
- `_prisma_migrations` does not exist (zero rows).
- After `init_schema` applied: 32 tables exist (`table_count = 32`).
- `init_schema` is sufficient as the basis for a working schema IF the additive collisions are removed or guarded.

## State C — Detailed characterization

- Schema reflects `init_schema` (32 tables + `auth_sessions` from init + `form_contract_versions` etc. if downstream migrations had applied before the failure).
- `_prisma_migrations` has the failed additive migration recorded with `finished_at = NULL, applied_steps_count = 0`.
- Any subsequent `prisma migrate deploy` returns P3009 because the failed-migration row blocks forward progress.
- This is the trap that any environment entering State C cannot escape without operator intervention.

## State D — Detailed characterization

- Schema is fully populated (all 32 init tables + all 5 form_contract_platform_v2 tables + auth_identities + auth_identity_audit_logs + generated_document_audit_logs).
- `_prisma_migrations` is missing one or more rows for the schema objects that physically exist.
- Prisma's `migrate status` will report "Database schema is not in sync" with a list of drift items.
- This state is **only reachable** if someone manually edited the schema without applying a migration — which is forbidden by the operating model.

## Recommended remediation compatibility

The recommended remediation (Option A — see MIGRATION_REMEDIATION_OPTIONS) supports States A, B, C, and D as follows:

- **State A**: Fresh database installs the new baseline directly. **PASS.**
- **State B / C / D**: Existing databases require a **one-time, operator-authorized `prisma migrate resolve --applied`** for the new baseline row, **after** schema-parity verification. This action is **NOT** executed in Phase 8B; it is **proposed** for the user to authorize in a subsequent phase.