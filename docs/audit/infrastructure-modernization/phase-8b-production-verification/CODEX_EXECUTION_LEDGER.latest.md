# Phase 8B Codex execution ledger

Captured from the live worktree. This ledger is intentionally concise; full migration and Docker logs live under `logs/`.

## Start-state reconciliation

- Hypothesis: the pasted handoff may be stale; the live worktree and current reports must be authoritative.
- Command: `git status --short`; `git diff --cached --name-only`; `git diff --name-only`; `git diff --name-status`; `git diff --stat`; `git rev-parse --abbrev-ref HEAD`; `git rev-parse HEAD`.
- Exit: 0 for every Git command.
- Decisive result: branch `audit/bm006-visual-fidelity-evidence`; HEAD `ea3e1c3c53278fad09c8557487ffb1d48d685a65`; 1,097 status entries; 247 tracked worktree diffs; staged files 0. Allowed Docker/package/CI paths already contain pre-existing work and remain user-owned.
- Files changed: none.
- Next gate: reconcile the Stage 4A object ledger before migration changes.

## Stage A1 — object-ledger correction

- Hypothesis: the published `11` duplicate total is a stale summary; the ledger rows contain 12 unique unguarded duplicate objects.
- Command: `node -e "...parse MIGRATION_OBJECT_OWNERSHIP.latest.json; count unique type:name keys and classifications..."`.
- Exit: 0.
- Decisive result: 34 unique ledger keys; seven non-empty, mutually exclusive classifications; 12 unguarded duplicates; 2 guarded duplicate objects; 2 intentional index redefinitions; 12 additive-only entries; no UNKNOWN.
- Files changed: `STAGE4A_LEDGER_CORRECTIONS.latest.md`; this ledger.
- Next gate: run the two dependency-aware sequences on disposable MariaDB 11.

## Stage A2 — dependency-aware replay

- Hypothesis: the prior isolated failures for scope uniqueness and identity audit logs are prerequisite failures, not migration defects.
- Command: `node docs/audit/infrastructure-modernization/phase-8b-production-verification/logs/codex-stage-a2-replay.mjs` against unique `mariadb:11` resources, with health polling and exact-name cleanup.
- Exit: 0.
- Decisive result: both databases began with zero tables. Init + contract-platform + scope-uniqueness exited 0 and produced both `scope_key` columns plus the final three-column unique indexes. Init + auth-identities + identity-audit exited 0 and produced both tables plus all three expected FKs. Both classifications are `VALID_WITH_PREREQUISITES`. Container/network/volume cleanup exits: 0/0/0; no matching leftovers.
- Files changed: `DEPENDENCY_AWARE_REPLAY.latest.md`; raw log and JSON envelope under `logs/`; this ledger.
- Next gate: generate the candidate baseline from the complete current Prisma schema and audit non-schema deltas.

## Stage B1 — generated candidate

- Hypothesis: the current init migration is incomplete; only Prisma diff from the complete current schema can produce the baseline DDL.
- Command: `pnpm --filter api exec prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script --output <phase8b>/stage4b-candidate/000000000000_squashed_baseline/migration.generated.sql`.
- Exit: 0.
- Decisive result: Prisma 6.19.3 generated 39 tables, 482 columns, 152 named indexes plus 39 declared primary keys, and 64 FKs. Generated SHA-256: `a8be201236a362adacbffeb4bd905db10942b54a9ed1a98ba8ec09b68b26efb7`; the file remains unchanged.
- Files changed: generated candidate SQL; `CANDIDATE_BASELINE_GENERATION.latest.md`; this ledger.
- Next gate: classify every old-chain custom SQL/data delta.

## Stage B2 — custom SQL/data delta

- Hypothesis: schema generation preserves structural DDL but omits functional database-managed timestamps and historical populated-row transforms.
- Command: full old-chain SQL review, generated-SQL review, targeted application-write searches, and byte diff between generated and candidate SQL.
- Exit: 0.
- Decisive result: one unconditional manual baseline delta is required: `auth_identities.updated_at ON UPDATE CURRENT_TIMESTAMP(0)`. Six legacy UPDATEs and one permission INSERT are not executed by a fresh baseline; three legacy transforms remain conditional transition concerns. No material candidate UNKNOWN remains. Candidate SHA-256: `002158c79fbace15308fb89caa3c65554489f10fa8ebc5622703f9953aee07d5`.
- Files changed: `migration.candidate.sql`; `CUSTOM_SQL_DATA_DELTA.latest.md`; this ledger.
- Next gate: fresh candidate application, Prisma deploy twice, status, schema/custom-delta parity.

## Stage B3 — fresh candidate proof

- Hypothesis: the augmented candidate may apply directly but still fail Prisma history, parity, or custom behavior checks.
- Command: isolated `mariadb:11` with separate direct/deploy databases; direct SQL apply; two `prisma migrate deploy` runs; `migrate status`; information-schema inventory; DB-to-schema and DB-to-DB `migrate diff`; custom `ON UPDATE` behavior probe.
- Exit: 0.
- Decisive result: both databases started at zero tables. Direct apply, deploy 1, deploy 2, and status all exited 0; failed migration rows 0. Both final schemas have 39 tables, 482 columns, 194 physical indexes, and 64 FKs. Both Prisma diffs are empty. All tables are InnoDB/`utf8mb4_unicode_ci`; custom timestamp behavior returned 1. Cleanup exits all 0; no matching leftovers.
- Files changed: `CANDIDATE_FRESH_DB_TEST.latest.md`; raw log and JSON envelope under `logs/`; corrected generated column count in the generation report; this ledger.
- Next gate: persistent DB read-only snapshot and E1/E2/E3 disposable transition simulations.

## Stage C - existing-database transition safety

- Hypothesis: the persistent schema and metadata may require DDL or make a squash unsafe.
- Command: metadata-only read-only snapshots plus E1/E2/E3 simulations on schema-only disposable MariaDB clones.
- Exit: 0 for the conclusive snapshot/simulation runs.
- Decisive result: persistent application structure is compatible except for two retained `DEFAULT 'GLOBAL'` clauses; metadata has 15 rows, 13 names, 2 historical rolled-back attempts, and 0 active failures. E1/E2/E3 all PASS without application-schema mutation. E2 requires resolving the failed legacy row as rolled back before resolving the baseline. Persistent structure and metadata hashes remained unchanged.
- Files changed: transition reports, operator runbook, raw metadata/simulation envelopes; no persistent database changes.
- Next gate: archive old history and activate the approved candidate.

## Stage D - active baseline and migration gate

- Hypothesis: the squash can be installed without losing rollback provenance and can be guarded deterministically in CI.
- Command: hash-verified archive/install, rollback rehearsal, focused TDD, fresh MariaDB gate, and active-history E1/E2/E3 repeat.
- Exit: 0 for final focused tests and real gate.
- Decisive result: 13/13 old SQL files archived with exact hashes; one active baseline at hash `002158c...07d5`; deploy `0/0`, status `0`, failed rows `0`, empty schema diff, cleanup PASS. One fail-closed CI job added.
- Files changed: active/archived migrations, migration gate/test, `.github/workflows/ci.yml`, reports.
- Next gate: production images and isolated stack boot.

## Stages E-H - Docker build, boot, verifier, and font

- Hypothesis: static Docker checks may hide build/boot or verifier aggregation defects, and requested fonts may resolve differently in the real image.
- Command: unique production builds, exact-image disposable Compose boot, verifier TDD/audit, and in-image LibreOffice/font conversion probe.
- Exit: API build `0`; Web build `0`; boot `0`; final verifier `0`; conversion `0`.
- Decisive result: both images build and boot non-root; migration/readiness/restart/shutdown/cleanup PASS. The verifier's prior `PASS_STATIC` was fixed so global PASS requires complete boot evidence. Times New Roman resolves to Liberation Serif; conversion works, but fidelity remains PARTIAL.
- Files changed: verifier/test and Docker reports; no Dockerfile/Compose change.
- Next gate: evidence classification and idempotence.

## Stages I-J - throttling and evidence idempotence

- Hypothesis: legacy timing/network labels may not prove throttling, while repeated apply may rewrite canonical evidence.
- Command: nine-form evidence audit, classifier TDD, and two formal apply runs in a 1,600-file disposable workspace.
- Exit: classifier tests `0`; both formal applies `0`.
- Decisive result: explicit 429 evidence is 0; all nine forms remain UNVERIFIED. Timing/network inference was removed from the collector. Both evidence applies were byte-identical, preserved history/order/201-12 semantics, and did not mutate canonical evidence.
- Files changed: classifier helper/test, targeted collector edit, reports.
- Next gate: independent full validation.

## Final validation and closeout

- Hypothesis: focused success may not survive full wrappers or protected-invariant comparison.
- Command: typechecks, lint, tests, build, audits/gates, `verify:quick`, `verify:full`, `verify:ci`, final migration/Docker gates, protected before/after fingerprints, Git and Docker cleanup checks.
- Exit: 0 for every official final command.
- Decisive result: all executed gates PASS; protected categories and semantics are equal; persistent structure/metadata hashes are unchanged; staged files and Phase 8B Docker leftovers are 0. Overall phase is PARTIAL because nine throttling classifications remain UNVERIFIED, Times New Roman is not present, and persistent metadata transition/operator contract bootstrap were not authorized.
- Files changed: `VALIDATION.latest.md`, `FINAL_REPORT.latest.md`, this ledger.
- Next gate: operator-approved Phase 8C release acceptance.
