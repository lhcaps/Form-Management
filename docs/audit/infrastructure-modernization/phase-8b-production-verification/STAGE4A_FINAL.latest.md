# STAGE4A_FINAL — Phase 8B Stage 4A Final Decision

| Field | Value |
|---|---|
| Status | **COMPLETE** |
| Captured at | 2026-07-11 01:35 +07:00 |
| Run ID | `phase8b-20260711-0135` |
| HEAD | `ea3e1c3c53278fad09c8557487ffb1d48d685a65` |
| Branch | `audit/bm006-visual-fidelity-evidence` |
| Staged files | 0 |

## CONFIRMED_FAILURE

- **migration**: `20260616000000_add_officials_role/migration.sql`
- **query**: `ALTER TABLE officials ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'OFFICIAL' COMMENT '...' AFTER is_active;` (query #1)
- **Prisma error**: `P3018` — A migration failed to apply. New migrations cannot be applied before the error is recovered from.
- **MariaDB error**: `1060` — Duplicate column name 'role'
- **duplicate object**: `officials.role`
- **owns the object**: `20260615000000_init_schema/migration.sql` line 486 (`role VARCHAR(20) NOT NULL DEFAULT 'OFFICIAL'`)
- **tries to add it**: `20260616000000_add_officials_role/migration.sql` (added 2026-06-17, **2 days BEFORE** `init_schema` entered git history)
- **first deploy exit**: 1
- **second deploy exit**: 1 (P3009 — failed-migration lock)

## OBJECT_OWNERSHIP

| Metric | Value |
|---|---|
| Total objects reviewed | 38 |
| INIT_ONLY | 1 (officials) |
| UNGUARDED_DUPLICATE | 11 (across 4 additive migrations) |
| GUARDED_DUPLICATE | 2 (auth_sessions + fk_auth_sessions_official, both guarded) |
| ADDITIVE_ONLY | 14 |
| ORDER_DEPENDENT | 2 (form_contract_versions, official_permissions) |
| DEFINITION_CONFLICT | 2 (uq_form_contract_scope_version, uq_official_permission_scope) |
| DEFINITION_CONFLICT_RESOLVED_AS_NOOP | 3 (3 MODIFY COLUMN defaults) |
| UNKNOWN | 0 |

### Per-migration duplicate count

| Migration | Unguarded duplicates |
|---|---|
| `20260616000000_add_officials_role` | 1 (`officials.role`) |
| `20260616010000_add_official_credentials` | 3 (`officials.username`, `officials.password_hash`, `uq_officials_username`) |
| `20260616020000_add_template_owner_official` | 4 (`templates.created_by_official_id`, `template_versions.created_by_official_id`, `fk_templates_created_by_official`, `fk_template_versions_created_by_official`) |
| `20260617010000_add_soft_delete_to_case_offenses_and_evidence` | 4 (`case_offenses.is_deleted`, `idx_case_offenses_deleted`, `evidence_items.is_deleted`, `idx_evidence_deleted`) |
| Total | **11 unduarded duplicates across 4 migrations** |

## REPLAY_MATRIX

Reproduced against fresh disposable MariaDB 11 (single boot, 12 sequential tests, ~30s total).

| # | Migration | Init exit | Target exit | Code | Verdict |
|---|---|---|---|---|---|
| 1 | `20260616000000_add_officials_role` | 0 | 1 | 1060 | **LATENT_DUPLICATE_FAILURE** (officials.role) |
| 2 | `20260616005000_create_auth_sessions` | 0 | 0 | — | VALID_AFTER_INIT (IF NOT EXISTS no-op) |
| 3 | `20260616010000_add_official_credentials` | 0 | 1 | 1060 | **LATENT_DUPLICATE_FAILURE** (officials.username) |
| 4 | `20260616020000_add_template_owner_official` | 0 | 1 | 1060 | **LATENT_DUPLICATE_FAILURE** (templates.created_by_official_id) |
| 5 | `20260616_add_auth_sessions` | 0 | 0 | — | VALID_AFTER_INIT (IF NOT EXISTS no-op) |
| 6 | `20260617010000_add_soft_delete_to_case_offenses_and_evidence` | 0 | 1 | 1060 | **LATENT_DUPLICATE_FAILURE** (case_offenses.is_deleted) |
| 7 | `20260617110000_fix_vietnamese_column_defaults` | 0 | 0 | — | VALID_AFTER_INIT (MODIFY COLUMN with identical default is no-op) |
| 8 | `20260620150000_add_form_contract_platform_v2` | 0 | 0 | — | VALID_AFTER_INIT (all new tables) |
| 9 | `20260620170000_enforce_form_contract_scope_uniqueness` | 0 | 1 | 1146 | **INVALID_ORDERING** (requires #8 first; cannot test in isolation) |
| 10 | `20260622000000_add_clerk_auth_identities` | 0 | 0 | — | VALID_AFTER_INIT (all new tables, guarded) |
| 11 | `20260702000000_add_auth_identity_audit_logs` | 0 | 1 | 1005 | **INVALID_ORDERING** (FK to auth_identities requires #10 first) |
| 12 | `20260702_generated_document_audit_logs` | 0 | 0 | — | VALID_AFTER_INIT (all new tables) |

**Summary**: 12 tested, 6 valid after init, 4 latent duplicate failures, 2 invalid orderings (caused by chain stopping at #1).

## INIT_PROVENANCE

- **Original commit**: `4ed21629` (2026-06-17 08:42 UTC+7) — created 5 UNGUARDED_DUPLICATE additive migrations **without** `init_schema`.
- **`init_schema` added in**: `86e606cd` (2026-06-19 01:46 UTC+7) — **2 days later**, with 813 lines that already contain the columns the earlier migrations would add.
- **Retroactively modified**: No (`init_schema` has a single `ADDED` event in git history; no subsequent modifications).
- **Conflicting additions**: All 4 UNGUARDED_DUPLICATE migrations (officials.role, officials.username/password_hash, templates.created_by_official_id, case_offenses.is_deleted).
- **Checksum implications**: Current `init_schema` checksum is the ONLY checksum in git history. There is no recoverable "original" to roll back to.

## ENVIRONMENT_STATES

| State | Description | Phase 8B observation |
|---|---|---|
| A — Fresh | 0 tables, 0 migrations | YES — Stage 3 reproduced; this is where the failure was caught |
| B — Legacy init | Old init without expanded fields | **NO** — git shows only one init_schema version |
| C — Expanded init | Current schema + failed migration row | YES — Stage 3 left this state in the disposable DB |
| D — Schema parity but metadata incomplete | Objects exist; `_prisma_migrations` incomplete | NOT OBSERVED — would require manual schema edits (forbidden) |

## OPTIONS

| Option | Recommendation | Rationale |
|---|---|---|
| **A. Clean baseline reset** | **RECOMMENDED** | Single canonical baseline; supports A/B/C/D; no fabricated history |
| B. Restore historical init | REJECTED | No recoverable history in git |
| C. Guard historical migrations with IF NOT EXISTS | ACCEPTABLE SECONDARY | Tactical fix; does not address logical inconsistency; checksum risk |
| D. Entrypoint auto-resolve | REJECTED | Hides defects; specifically forbidden against persistent DB |
| E. Fresh-install bootstrap outside Prisma | ACCEPTABLE ALTERNATIVE | Same outcome as A but heavier (canonical schema dump) |

See `MIGRATION_REMEDIATION_OPTIONS.latest.{md,json}` for full evaluation.

## RECOMMENDED_STRATEGY

**OPTION A — Clean baseline reset.**

The procedure:

1. **Stage 4B (NOT in this report)**: User authorizes implementation.
2. **Archive current migration chain**: Move `apps/api/prisma/migrations/<12 migrations>` to an external archive (e.g. `docs/audit/infrastructure-modernization/phase-8b-production-verification/migrations-archive/`).
3. **Generate new baseline**: Create a single new migration `<NEW_TIMESTAMP>_baseline_init/migration.sql` whose content equals the current `init_schema/migration.sql` (the schema that already exists in the persistent user DBs and that `schema.prisma` declares).
4. **For fresh DBs** (Stage A): `prisma migrate deploy` applies the new baseline in a single step.
5. **For existing DBs** (States B/C/D):
   - Run read-only `prisma migrate diff` to confirm schema parity with the new baseline.
   - After parity confirmation, operator-authorized `prisma migrate resolve --applied <baseline>` marks the new baseline as applied without altering schema.
6. **For future migrations**: Authored as additive migrations after the new baseline.

## WHY

1. **Logical consistency**: a single canonical baseline makes the migration history defensible and auditable.
2. **No fabricated history**: every object in the new baseline is observable in either the current `init_schema` or `schema.prisma`.
3. **Forward-only**: Prisma's design favors additive migrations; replacing the chain with a single baseline is a one-time event, not a recurring pattern.
4. **Bounded operational risk**: only one operator-authorized action per existing DB.
5. **Failure-mode coverage**: the new migration-regression gate (Stage 4A.8 design) prevents the current failure from re-occurring.

## PERSISTENT_DB_ACTIONS_PROPOSED

| Action | Target | Operator | Phase 8B executes? |
|---|---|---|---|
| `prisma migrate resolve --applied <baseline>` | persistent user DB | User-authorized DBA | **NO** — proposed only |

No command has been executed against a persistent DB in Phase 8B.

## FILES_TO_CHANGE_IN_IMPLEMENTATION_PHASE

| File | Change type |
|---|---|
| `apps/api/prisma/migrations/<TIMESTAMP>_baseline_init/migration.sql` | CREATE — content = current `init_schema/migration.sql` |
| `apps/api/prisma/migrations/<12 existing directories>` | MOVE to external archive (NOT delete) |
| `docs/audit/infrastructure-modernization/phase-8b-production-verification/migrations-archive/` | CREATE — archived migration SQLs |
| `docs/audit/infrastructure-modernization/phase-8b-production-verification/MIGRATION_REMEDIATION_PLAN.latest.md` | CREATE — operator procedure |
| `scripts/audit/migration-regression-gate.mjs` | CREATE — Stage 4A.8 gate |
| `test/migration-regression-gate.test.mjs` | CREATE — gate smoke test |
| `.github/workflows/ci.yml` | EDIT — add `migration-regression-gate` job (no existing job removed) |
| `README.md` | EDIT — operator procedure addendum |

No file in the protected areas (`schema.prisma`, `source DOCX`, `normalized DOCX`, `locked contracts`, `compiled contracts`, `form-studio retirement`, `BM form-input components`, `runtimeReady allowlist`) is touched.

## REGRESSION_GATE

Designed in `MIGRATION_REGRESSION_GATE_DESIGN.latest.md`. Implementation is deferred to Stage 4B.

Key properties:
- Disposable MariaDB 11 + sidecar Prisma CLI on hermetic Docker network.
- First deploy exit 0 required.
- Second deploy exit 0 required (idempotence).
- Zero rows in `_prisma_migrations` with `finished_at IS NULL`.
- information_schema parity vs schema.prisma models.
- All resources cleaned up on every path.
- No persistent DB or persistent credentials touched.

## RISKS

| Risk | Likelihood | Mitigation |
|---|---|---|
| User rejects Option A | Medium | Option C (IF NOT EXISTS guards) is acceptable secondary |
| New baseline content diverges from current init_schema | Low | Use exact current init_schema content; verify by byte-equal comparison |
| Existing DBs do not match new baseline exactly | Low | Read-only `prisma migrate diff` before any resolve |
| Migration-regression gate has a bug and silently passes | Medium | Triple-implement the gate's assertions and unit-test them |
| Archived migrations are lost | Low | Archive to a path outside the active Prisma dir; commit to git history separately if user authorizes |

## NEED_USER_DECISION

The following decisions are blocking Stage 4B:

1. **Approve OPTION A** (clean baseline reset) OR instruct an alternative.
2. **Authorize the one-time `prisma migrate resolve --applied <baseline>`** for existing persistent DBs (this is the only persistent-DB write proposed).
3. **Authorize archiving the current 12 migration directories** to `docs/audit/.../migrations-archive/` (NOT deleting them).
4. **Authorize creating the new baseline migration** with content = current `init_schema/migration.sql`.

## GIT

| Metric | Value |
|---|---|
| Staged | 0 |
| Modified (working tree) | 247 (pre-Phase 7 working state — not from Phase 8B) |
| Committed | 0 |
| Pushed | 0 |
| PR opened | 0 |

All Phase 8B artifacts live under `docs/audit/infrastructure-modernization/phase-8b-production-verification/`. No source code modified.

## NEXT_PHASE

`BLOCKED_PENDING_USER_DECISION`

Phase 8B cannot proceed past Stage 4A without explicit user authorization for OPTION A (or selection of an alternative option). The user's answer to the four NEED_USER_DECISION items above determines whether Stage 4B proceeds with implementation or whether Phase 8B stops here and reports `BLOCKED_PENDING_USER_DECISION` in `FINAL_REPORT.latest.md`.