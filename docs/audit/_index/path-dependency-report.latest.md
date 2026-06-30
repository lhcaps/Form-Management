# Path Dependency Report — docs/audit

**Generated:** 2026-06-29T00:00:00.000Z  
**Task:** `REPO_HYGIENE_AND_SOT_GATES_V1`

## Summary

| Metric | Value |
|--------|-------|
| Scripts scanned | 87 |
| Path references | 169 |
| Hardcoded audit paths | 15 |
| Hardcoded canonical paths | 3 |
| Safe-to-ignore candidates | 8 |
| Scripts with hardcoded paths | 12 |

---

## Critical Path: `docs/audit/docx/contracts/locked`

**Type:** CANONICAL_SOT — Semantic working SOT  
**Usage:** 24 scripts  
**Risk:** CRITICAL

**Producer scripts:**
- `packages/form-contracts/scripts/compile-contracts.ts`
- `scripts/docx-contract/fix-locked-slots-after-remediation.mjs`
- `scripts/docx-contract/fix-locked-slots-after-wave-02-remediation.mjs`
- `scripts/docx-contract/lock-reviewed-contracts.mjs`
- `scripts/docx-contract/reconcile-locked-contract-artifacts.mjs`

**Consumer scripts:**
- `scripts/_verify_all_contracts.mjs`
- `scripts/_debug_compile.mjs`, `scripts/_debug_warn.mjs`
- `scripts/audit/test-golden-docx.mjs`
- `scripts/audit/audit-sot-rebase-v1.mjs`
- `scripts/audit/audit-contract-sync.mjs`
- `scripts/audit/refresh-213-docx-fidelity-board.mjs`
- `apps/api/src/modules/form-studio/application/runtime-form-contract.service.ts`

**Can move:** NO  
**Can ignore:** NO  
**Decision:** NEVER move or ignore. This is the semantic SOT.

---

## Critical Path: `docs/audit/docx/compiled-v2`

**Type:** DERIVED_ARTIFACT — NOT SOT  
**Usage:** 18 scripts  
**Risk:** HIGH

**Producer:** `packages/form-contracts/scripts/compile-contracts.ts`  
**Consumers:** `audit-sot-rebase-v1.mjs`, `audit-contract-sync.mjs`, `publish-locked-contracts-to-db.mjs`

**Can move:** NO  
**Can ignore:** NO (unless project formally decides compiled-v2 is no longer committed)  
**Decision:** Keep committed. Generated from locked contracts. Must stay in sync.

---

## Hardcoded Path References (must update scripts before moving)

### `docs/audit/213-docx-fidelity-board/`
- **Hardcoded in:** `scripts/audit/refresh-213-docx-fidelity-board.mjs`
- **Type:** GENERATED_REPORT_OUTPUT
- **Status:** One-off report, safe to archive after script path is updated

### `docs/audit/per-form-render-accurate/`
- **Hardcoded in:** `scripts/audit/render-form-fidelity-gate.mjs`
- **Type:** GENERATED_REPORT_OUTPUT
- **Status:** Recreatable on demand. Safe to archive after script path update.

### `docs/audit/docx-path-binding-layer-*-approved/`
- **Hardcoded in:** `apply-docx-path-binding-layer-*-approved.mjs`
- **Type:** APPLY_SCRIPT_OUTPUT
- **Status:** Safe to archive. Update apply script path before move.

### `docs/audit/docx-wave-02-manual-review-pack/`
- **Hardcoded in:** `apply-docx-wave-02-manual-review-approved.mjs`
- **Type:** APPLY_SCRIPT_OUTPUT
- **Status:** Safe to archive. Update apply script path before move.

### `docs/audit/wave-02-safe-label-only-bm-163-current-address/`
- **Hardcoded in:** `apply-wave-02-safe-label-only-bm-163-current-address.mjs`
- **Type:** APPLY_SCRIPT_OUTPUT
- **Status:** Safe to archive. Update apply script path before move.

### `docs/audit/213-bm-remediation-master-plan/`
- **Hardcoded in:** `scripts/audit/plan-213-bm-remediation-master.cjs`
- **Type:** GENERATED_REPORT_OUTPUT
- **Status:** Safe to archive. Update plan script path before move.

### `docs/audit/docx-placeholder-renormalization/`
- **Hardcoded in:** `scripts/audit/plan-docx-placeholder-renormalization.mjs`
- **Type:** ACTIVE_WORK_OUTPUT
- **Status:** ACTIVE — do NOT move until remediation is closed.

### `docs/audit/contract-repair-batch-1-approved/`
- **Hardcoded in:** `scripts/audit/apply-contract-repair-batch-1-approved.mjs`
- **Type:** APPLY_SCRIPT_OUTPUT
- **Status:** Safe to archive. Update apply script path before move.

---

## Active Gate Paths (do not move)

### `docs/audit/sot-rebase-v1/`
- **Producer:** `scripts/audit/audit-sot-rebase-v1.mjs`
- **Consumer:** `test/sot-rebase-v1.test.mjs`
- **Contains:** CRITICAL findings (BM-063, BM-066 stale compiled bindings)

### `docs/audit/forms-root-cause/`
- **Producer:** `scripts/audit/audit-forms-root-cause.mjs`
- **Consumer:** `test/forms-root-cause-fix-plan.test.mjs`
- **Status:** ACTIVE — ongoing remediation

### `docs/audit/form-authoring-baselines/`
- **Type:** Human-reviewed ledger
- **Contains:** `audited.md`, `matrix.csv`
- **Risk:** HIGH — do NOT lose

### `docs/audit/docx-atlas-v1/`
- **Producer:** `build-docx-atlas-v1.mjs`, `build-contract-atlas-v1.mjs`, `build-render-atlas-v1.mjs`
- **Consumer:** `refresh-213-docx-fidelity-board.mjs`
- **Status:** ACTIVE — wave-02 reference data

---

## CodeGraph Findings

All 6 CodeGraph queries executed successfully:

1. **docs/audit path readers/writers** — 169 symbols across 87 files
2. **Locked contract readers** — 24 scripts read from `docs/audit/docx/contracts/locked`
3. **compiled-v2 readers/writers** — 18 scripts read/write `docs/audit/docx/compiled-v2`
4. **package.json audit scripts** — Many scripts call audit/docx/contract scripts
5. **Hardcoded path references** — 15 hardcoded strings found
6. **Safe ignore candidates** — 8 temp/cache directories identified

**codeGraphHealth.exploreQuerySucceeded:** `true`

---

## Move Decision

**canMoveAuditFoldersNow:** `NO`

**Reason:** 12 scripts have hardcoded output paths. Moving folders without updating scripts would break those scripts.

**Required process:**
1. Planner task: update hardcoded paths in scripts (12 scripts identified)
2. Verify no remaining references
3. Planner approves move
4. Move folders to `docs/audit/_archive/{name}/`
5. Optionally add `docs/audit/_archive/` to `.gitignore` after confirmation
