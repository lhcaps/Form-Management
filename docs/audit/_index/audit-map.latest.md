# Audit Map — docs/audit Inventory

**Generated:** 2026-06-29T00:00:00.000Z  
**Task:** `REPO_HYGIENE_AND_SOT_GATES_V1`  
**Total audit folders:** 69 | **Total files:** 2,620 | **Total size:** 50.4 MB

---

## Category Summary

| Category | Count | Description |
|---|---|---|
| **ACTIVE_CANONICAL** | 1 | Permanent canonical data store. NEVER move or ignore. |
| **ACTIVE_GATE** | 4 | Active audit/gate scripts and outputs. Keep until formally retired. |
| **ACTIVE_LEDGER** | 2 | Human-reviewed tracking ledgers. Do NOT ignore or move. |
| **ACTIVE_REPORT** | 1 | Active remediation work-in-progress. Keep until closed. |
| **GENERATED_REPORT** | 56 | One-off/completed reports. Archive candidates. |

**canMoveAuditFoldersNow:** `NO` — all GENERATED_REPORT folders have hardcoded script path dependencies. Planner task required to update paths before move.

---

## ACTIVE_CANONICAL

### `docs/audit/docx/` — **NEVER MOVE / NEVER IGNORE**
- **Files:** 1,600 | **Size:** 17.42 MB
- **Contains:**
  - `contracts/locked/` — 213 locked contract JSON files (semantic working SOT)
  - `compiled-v2/` — 213 compiled artifact JSON files (derived, NOT SOT)
  - `reports/FORM-CONTRACT-DB-PUBLISH.md` — DB publish status doc
- **Producer:** `scripts/docx-contract/*.mjs`, `packages/form-contracts/scripts/compile-contracts.ts`
- **Consumer:** All audit scripts, API runtime, form-contracts compiler
- **Risk:** HIGH — losing locked contracts means losing the semantic SOT

---

## ACTIVE_GATE

### `docs/audit/_index/` — Hub directory for audit documentation
- **Files:** 0 (just created) | **Size:** 0 MB
- **Producer:** `REPO_HYGIENE_AND_SOT_GATES_V1`
- **Risk:** LOW

### `docs/audit/sot-rebase-v1/` — SOT rebase audit gate
- **Files:** 16 | **Size:** 3.03 MB | **Modified:** 2026-06-29
- **Output:** `latest.json`, `per-bm.csv`, `compiled-v2-stale.latest.json`
- **Producer:** `scripts/audit/audit-sot-rebase-v1.mjs`
- **Consumer:** `test/sot-rebase-v1.test.mjs`
- **CRITICAL findings:** BM-063, BM-066 compiled-v2 stale vs locked
- **Risk:** MEDIUM — gate report, must be kept

### `docs/audit/sot-gates-v1/` — NEW gate created by this task
- **Files:** 2 | **Size:** 0 MB
- **Producer:** `REPO_HYGIENE_AND_SOT_GATES_V1`
- **Consumer:** `test/locked-compiled-consistency.test.mjs`, `test/semantic-evidence-baseline-gate.test.mjs`
- **Risk:** LOW

### `docs/audit/forms-root-cause/` — Forms root cause audit gate
- **Files:** 3 | **Size:** 2.29 MB | **Modified:** 2026-06-26
- **Output:** `latest.json`, `latest.md`
- **Producer:** `scripts/audit/audit-forms-root-cause.mjs`
- **Risk:** MEDIUM — ongoing remediation

---

## ACTIVE_LEDGER

### `docs/audit/form-authoring-baselines/` — Human-reviewed remediation ledger
- **Files:** 55 | **Size:** 0.21 MB | **Modified:** 2026-06-22
- **Contains:** `audited.md`, `matrix.csv`
- **Producer:** `scripts/audit/audit-forms-root-cause.mjs` (human-reviewed)
- **Risk:** HIGH — human-reviewed evidence ledger, do NOT lose

### `docs/audit/docx-atlas-v1/` — DOCX structural atlas
- **Files:** 39 | **Size:** 17.92 MB | **Modified:** 2026-06-28
- **Contains:** `contract-atlas`, `render-atlas`, `docx-atlas`, `smart-remediation-queue`
- **Producer:** `scripts/audit/build-docx-atlas-v1.mjs`, `build-contract-atlas-v1.mjs`, `build-render-atlas-v1.mjs`
- **Consumer:** `scripts/audit/refresh-213-docx-fidelity-board.mjs`
- **Risk:** MEDIUM — active wave-02 reference

---

## ACTIVE_REPORT

### `docs/audit/docx-placeholder-renormalization/` — Active wave-02 work
- **Files:** 165 | **Size:** 1.50 MB | **Modified:** 2026-06-28
- **Contains:** decisions, apply scripts for BM-052, BM-062, BM-063, BM-066
- **Risk:** MEDIUM — NOT closed

---

## GENERATED_REPORT — Archive Candidates (56 folders)

All 56 folders below contain completed or one-off investigations. They are **safe to archive** but **MUST NOT be ignored** unless first moved. All have hardcoded path dependencies in scripts.

**canMoveAuditFoldersNow:** `NO`  
**Recommended archive path:** `docs/audit/_archive/{folder-name}/`  
**Recommended process:** Planner task to update script hardcoded paths → move → optionally gitignore

### By size (largest first):

| Folder | Files | Size MB | Status | Hardcoded Path |
|--------|-------|--------|--------|---------------|
| `docx-atlas-v1/` | 39 | 17.92 | ACTIVE (atlas) | build scripts |
| `docx/` | 1586 | 16.92 | **CANONICAL** | many scripts |
| `per-form-render-accurate/` | 525 | 2.19 | One-off | render-form-fidelity-gate.mjs |
| `forms-root-cause-fix-plan/` | 8 | 2.45 | One-off | plan script |
| `docx-placeholder-renormalization/` | 165 | 1.50 | ACTIVE | apply scripts |
| `bm-auto-populate-sot/` | 6 | 1.12 | One-off | none |
| `docx-slot-inventory/` | 4 | 0.43 | One-off | audit script |
| `docx-structural-fidelity/` | 2 | 0.22 | One-off | audit script |
| `213-bm-remediation-master-plan/` | 4 | 0.34 | One-off | plan-213-bm-remediation-master.cjs |
| `docx-slot-naming-structural-wave-02-planning/` | 8 | 0.33 | Closed | none |
| `forms-root-cause-review-batch-2/` | 10 | 0.29 | Closed | none |
| `forms-root-cause-review-batch-1/` | 13 | 0.23 | Closed | none |
| `docx-wave-02-manual-review-pack/` | 20 | 0.25 | Closed | apply script |
| `213-docx-fidelity-board/` | 20 | 0.55 | One-off | refresh script |
| *(52 more folders ≤0.2MB each)* | — | — | various | see JSON |

---

## Move Policy

**NO folder can be moved in this task.** Path dependencies in scripts must be updated first.

Folders with hardcoded paths (must update scripts before moving):

1. `docs/audit/docx/` — **CANONICAL — do not move**
2. `docs/audit/213-docx-fidelity-board/` — hardcoded in `refresh-213-docx-fidelity-board.mjs`
3. `docs/audit/docx-path-binding-layer-a-approved/` — hardcoded in apply script
4. `docs/audit/docx-path-binding-layer-b-approved/` — hardcoded in apply script
5. `docs/audit/docx-path-binding-layer-c-approved/` — hardcoded in apply script
6. `docs/audit/docx-wave-02-manual-review-pack/` — hardcoded in apply script
7. `docs/audit/wave-02-safe-label-only-bm-163-current-address/` — hardcoded in apply script
8. `docs/audit/per-form-render-accurate/` — hardcoded in `render-form-fidelity-gate.mjs`
9. `docs/audit/213-bm-remediation-master-plan/` — hardcoded in plan script
10. `docs/audit/path-domain-binding-batch-1-bm096-single-candidate/` — hardcoded in plan scripts

---

## .gitignore Status

**Current .gitignore is adequate for audit artifacts.**

Audit folders that are safe for future `.gitignore` (after move):
- `docs/audit/_archive/` — once all one-off reports are moved

**NEVER add to .gitignore:**
- `docs/audit/docx/contracts/locked/`
- `docs/audit/docx/compiled-v2/`
- `docs/audit/form-authoring-baselines/`
- `docs/audit/docx-atlas-v1/` (until formally archived)
- `docs/audit/sot-rebase-v1/`
- `docs/audit/sot-gates-v1/`
- `docs/audit/forms-root-cause/`
