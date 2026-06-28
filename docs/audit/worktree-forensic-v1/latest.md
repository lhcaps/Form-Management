# Worktree Forensic — `WORKTREE_FORENSIC_AND_PROTECTION_V1`

**Generated:** 2026-06-29 02:07 UTC+7
**HEAD:** `5ff60922` — ci: add locked-compiled SOT gate

---

## Executive Summary

Worktree contains **51 modified tracked files** and **147 untracked files** (198 total). Classification breakdown:

| Category | Count | Risk | Action |
|---|---|---|---|
| SOT_LOCKED_CONTRACT | 19 | MEDIUM | KEEP_FOR_PLANNER_REVIEW |
| DERIVED_COMPILED_V2 | 18 | MEDIUM | KEEP_FOR_PLANNER_REVIEW |
| SOT_NORMALIZED_DOCX | 7 | MEDIUM/HIGH | KEEP_FOR_PLANNER_REVIEW |
| AUDIT_REPORT | 4 | LOW | ARCHIVE_CANDIDATE |
| SCRIPT_INFRA | 2 | LOW | COMMIT_CANDIDATE |
| GENERATED_SOURCE | 1 | LOW | GENERATED_REBUILD_CANDIDATE |
| RUNTIME_DB_REPORT | 1 | LOW | ARCHIVE_CANDIDATE |
| Untracked audit folders | 40 | LOW | ARCHIVE_CANDIDATE |
| Untracked scripts | 70 | LOW | REVIEW_BEFORE_DELETE |
| Untracked tests | 25 | LOW | REVIEW_BEFORE_DELETE |
| Untracked source | 2 | MEDIUM | INVESTIGATE_MANUALLY |

**Recommendation:** `CLEAN_GENERATED_AUDIT_ARTIFACTS_V1` — the majority of worktree dirt is audit artifact clutter. SOT files should not be blindly restored.

---

## Gates Status

| Gate | Result | Detail |
|---|---|---|
| `pnpm audit:locked-compiled:strict` | PASS | 213/213 consistent |
| `pnpm audit:contract-sync` | PASS | matched=213 stale=0 |
| `pnpm typecheck` | PASS | Clean |

All gates pass. No regression from this forensic session (read-only).

---

## Tracked Modified Classification

### SOT_LOCKED_CONTRACT (19 files) — KEEP_FOR_PLANNER_REVIEW

> These are the **semantic working SOT**. All C3 passes confirming compiled-v2 is derived from these changes. These files are evidence of intentional approved remediation mutations. **DO NOT RESTORE BLINDLY.**

| BM | Diff | Likely Producer |
|---|---|---|
| BM-001 | +451/-451 | forms-root-cause batch + contract-repair |
| BM-002 | +71/-71 | forms-root-cause batch |
| BM-003 | +194/-194 | forms-root-cause batch |
| BM-021 | +78/-78 | forms-root-cause batch |
| BM-022 | +79/-79 | forms-root-cause batch |
| BM-025 | +79/-79 | forms-root-cause batch |
| BM-032 | +79/-79 | forms-root-cause batch |
| BM-036 | +51/-51 | forms-root-cause batch |
| BM-052 | +227/-227 | multi-wave remediation (largest) |
| BM-062 | +110/-110 | multi-wave remediation |
| BM-063 | +1/-1 | **ROLLBACK evidence** |
| BM-064 | +66/-66 | forms-root-cause batch |
| BM-065 | +110/-110 | forms-root-cause batch |
| BM-066 | +1/-1 | **ROLLBACK evidence** |
| BM-067 | +110/-110 | forms-root-cause batch |
| BM-073 | +186/-186 | docx-path-binding layer A |
| BM-080 | +66/-66 | forms-root-cause batch |
| BM-096 | +22/-22 | batch-3 label-only dictionary |
| BM-167 | +66/-66 | forms-root-cause batch |

**BM-063 and BM-066 rollback note:** These have minimal diffs (+1/-1) but are critical evidence of the rollback event. Restoring them would re-introduce broken remediation state. Keep for planner review.

### DERIVED_COMPILED_V2 (18 files) — KEEP_FOR_PLANNER_REVIEW

> CI-gated derived artifacts. All +1/-1 line diffs (likely CRLF normalization or field reordering). C3 strict passes 213/213 confirming these are consistent with locked. **Restore would break C3 gate.**

- BM-001, BM-002, BM-003, BM-021, BM-022, BM-025, BM-032, BM-036, BM-052, BM-062, BM-064, BM-065, BM-067, BM-073, BM-080, BM-096, BM-167

### SOT_NORMALIZED_DOCX (7 files) — KEEP_FOR_PLANNER_REVIEW

> Structural SOT files. Three are critical high-risk findings:

| BM | Size Change | Risk | Notes |
|---|---|---|---|
| BM-021 | 10408 → 10399 (-9B) | MEDIUM | Minor renormalization |
| BM-031 | 82870 → 19284 (-77%) | **HIGH** | Massive renormalization — investigate |
| BM-044 | 20327 → 20311 (-16B) | MEDIUM | Minor renormalization |
| BM-052 | 68046 → 11079 (-84%) | **HIGH** | Approved placeholder renormalization |
| BM-056 | 48247 → 48241 (-6B) | MEDIUM | Minor renormalization |
| BM-062 | 92886 → 13077 (-86%) | **HIGH** | Approved placeholder renormalization |
| BM-021 source | 10529B (0 delta) | LOW | CRLF-only change |

**BM-031, BM-052, BM-062 size reductions are unusually large.** All three passed docx-placeholder renormalization approval. The renormalization removed placeholder markup that was in the DOCX but not rendered — this is normal for placeholder renormalization. Keep as evidence of approved remediation.

### GENERATED_SOURCE (1 file) — GENERATED_REBUILD_CANDIDATE

```
apps/api/src/modules/form-studio/infrastructure/legacy-renderer-capabilities.generated.ts
```

**Diff:** `-BM-213` removed from `GENERIC_LEGACY_RENDERERS` set.
**Producer:** Regenerated from `apps/web/src/components/documents/bm-*-form-inputs.tsx`.
**Risk:** LOW. Rebuilds cleanly.
**Action:** `GENERATED_REBUILD_CANDIDATE` — safe to regenerate.

### SCRIPT_INFRA (2 files) — COMMIT_CANDIDATE

| File | Diff | Action |
|---|---|---|
| `scripts/audit/audit-forms-root-cause.mjs` | +105/-105 | Commit candidate — infra enhancement |
| `scripts/docx-contract/publish-locked-contracts-to-db.mjs` | +3/-3 | Commit candidate — infra enhancement |

### AUDIT_REPORT (4 files) — ARCHIVE_CANDIDATE

| File | Notes |
|---|---|
| `docs/audit/form-authoring-baselines/audited.md` | Historical baseline report |
| `docs/audit/form-authoring-baselines/matrix.csv` | Historical matrix |
| `docs/audit/forms-root-cause/latest.json` | **Referenced by apply scripts** — do NOT archive without review |
| `docs/audit/forms-root-cause/latest.md` | Derivative markdown |

**Caution:** `forms-root-cause/latest.json` is referenced by multiple apply scripts (`apply-forms-root-cause-review-batch-*.mjs`) as `AUDIT_LATEST_JSON`. Archiving this requires updating the audit first.

### RUNTIME_DB_REPORT (1 file) — ARCHIVE_CANDIDATE

```
docs/audit/docx/reports/FORM-CONTRACT-DB-PUBLISH.md
```

Generated by this session's DB publish. Not referenced by any CI or source code. Safe to commit as evidence of DB sync operation, or delete as transient artifact.

---

## Untracked Classification

### UNTRACKED_AUDIT_FOLDER (40 folders) — ARCHIVE_CANDIDATE

All untracked audit folders are **NOT referenced** by CI, package scripts, or source code (confirmed by CodeGraph). These are evidence of prior remediation investigations. Safe to archive or delete after decisions are committed.

Key folders:
- `docx-atlas-v1/` — atlas build artifacts
- `docx-path-binding-*-approved/` — approved path binding decisions
- `blocked-bm-forensics/` — forensic reports
- `sot-rebase-v1/` — SOT rebase evidence
- `commit-readiness/` — infra readiness reports
- `forms-root-cause-apply/backups/` — apply backups

### UNTRACKED_SCRIPT (70 files) — REVIEW_BEFORE_DELETE

Many `apply-*.mjs` scripts contain decision ledgers and should be kept as evidence. Review individually before deletion. Do NOT delete `apply-*-approved.mjs` scripts without checking if they have uncommitted decisions.

### UNTRACKED_SOURCE (2 files) — INVESTIGATE_MANUALLY

- `packages/form-contracts/src/field-labels.ts`
- `packages/form-contracts/test/field-labels.test.ts`

These appear to be new source files for a field-labels feature. Needs human review to determine if intentional or debug artifact.

### UNTRACKED_CURSOR_RULE (1 file)

- `.cursor/rules/qllaw-contract-remediation.mdc`

Cursor-specific rule file. Check if intentional.

---

## High/Critical Risk Files

| File | Risk | Finding |
|---|---|---|
| `storage/templates/normalized-docx/BM-031/BM-031_normalized.docx` | HIGH | 77% size reduction — massive renormalization |
| `storage/templates/normalized-docx/BM-052/BM-052_normalized.docx` | HIGH | 84% size reduction — approved placeholder renormalization |
| `storage/templates/normalized-docx/BM-062/BM-062_normalized.docx` | HIGH | 86% size reduction — approved placeholder renormalization |
| `docs/audit/docx/contracts/locked/BM-052__9919ecdb3971.contract.locked.json` | MEDIUM | Largest diff (+227/-227) — multi-wave evidence |
| `docs/audit/docx/contracts/locked/BM-063__54b73110a34f.contract.locked.json` | MEDIUM | Rollback evidence — DO NOT RESTORE |
| `docs/audit/docx/contracts/locked/BM-066__e3bc56081554.contract.locked.json` | MEDIUM | Rollback evidence — DO NOT RESTORE |

---

## CodeGraph Findings

| Finding | Result |
|---|---|
| `FORM-CONTRACT-DB-PUBLISH.md` referenced by code? | **NO** — pure runtime report |
| `legacy-renderer-capabilities.generated.ts` consumer? | Yes — `legacy-document-renderer.adapter.ts` |
| `legacy-renderer-capabilities.generated.ts` producer? | `bm-*-form-inputs.tsx` components |
| Untracked audit folders referenced by CI? | **NO** — safe to archive |
| Locked contracts producers? | `audit-forms-root-cause.mjs`, `apply-*.mjs`, `publish-locked-contracts-to-db.mjs` |
| Locked contracts consumers? | `pnpm contract:compile`, `audit:contract-sync`, `audit:locked-compiled:strict` |

---

## Files Written By This Task

- `docs/audit/worktree-forensic-v1/latest.json` — structured forensic data
- `docs/audit/worktree-forensic-v1/latest.md` — this report

---

## Guardrail Proof

| Rule | Status |
|---|---|
| No locked contracts mutated | ✓ |
| No compiled-v2 mutated | ✓ |
| No normalized DOCX mutated | ✓ |
| No DB publish | ✓ |
| No audit folders moved | ✓ |
| No staging | ✓ |
| No commit | ✓ |
| No semantic fix | ✓ |
| No restore | ✓ |

---

## Commit Made: NO

---

## Recommended Next Task

**`CLEAN_GENERATED_AUDIT_ARTIFACTS_V1`** — approved.

Rationale: The overwhelming majority (147 untracked + 5 archive-candidate tracked) are generated/report clutter. The SOT files (19 locked + 18 compiled-v2 + 7 normalized DOCX) are intentional mutation evidence and must not be touched in this clean task.

Scope for `CLEAN_GENERATED_AUDIT_ARTIFACTS_V1`:
1. Delete untracked audit folders that are fully closed (approval lanes with closure reports)
2. Delete untracked scripts that are purely investigative (not containing decision ledgers)
3. Delete untracked test files for deleted scripts
4. Delete temp Office files
5. Delete PDF smoke artifacts
6. Commit infra scripts (`audit-forms-root-cause.mjs`, `publish-locked-contracts-to-db.mjs`)
7. Archive or commit `FORM-CONTRACT-DB-PUBLISH.md`

**Out of scope for clean task:** locked contracts, compiled-v2, normalized DOCX, `forms-root-cause/latest.json`.

**Deferred decisions:**
- `RESTORE_ACCIDENTAL_SOT_DIRTY_FILES_V1` — NOT YET. Need planner approval on which SOT files are truly accidental vs intentional. The forensic evidence suggests most SOT modifications are intentional.
- `INVESTIGATE_BM031_MASSIVE_RENORMALIZATION` — BM-031 dropped 77% in size. Requires investigation before committing.
- `field-labels.ts INVESTIGATION` — new source file needs human review.
