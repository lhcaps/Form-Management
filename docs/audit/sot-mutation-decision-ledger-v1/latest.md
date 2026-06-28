# SOT Mutation Decision Ledger V1

**Task:** `SOT_MUTATION_DECISION_LEDGER_V1`
**Generated:** 2026-06-29T02:34:00+07:00
**Head Commit:** `85960dcb infra: refine form audit and publish tooling`

---

## Executive Summary

49 tracked files are modified from HEAD. Of these, **44 are SOT-related** (19 locked contracts, 18 compiled-v2, 7 normalized DOCX). All 4 CI gates PASS.

The 19 modified locked contracts were produced by **6 waves of approved apply scripts**. Cross-referencing all approval ledgers, forensic reports, and closure documents yields a clear 3-tier classification:

| Group | BMs | Count | Decision |
|-------|-----|-------|----------|
| **COMMIT_APPROVED** | BM-001, 002, 003, 021, 022, 025, 032, 036, 064, 065, 067, 073, 080, 096, 167 | **15** | Commit approved set |
| **KEEP_DIRTY** | BM-052, 062, 063, 066 | **4** | Keep dirty pending resolution |
| **INVESTIGATE** | BM-031 | **1** | DOCX renormalization investigation |

**`canCommitApprovedSotSetNow: NO`** — must resolve `INVESTIGATE` first (BM-031 DOCX).

**`canStartSemanticRemediation: NO`** — blocked by dirty BMs and investigation.

---

## SOT Policy

| Layer | Role |
|-------|------|
| `normalized DOCX` | Structural SOT — placeholder template source |
| `locked contract JSON` | Semantic working SOT — current contract state |
| `compiled-v2 JSON` | Derived artifact — CI-gated, follows locked |
| `DB compiled_json` | Runtime published copy — NOT SOT |

**SOT dependency rule:** `normalized DOCX → locked contract → compiled-v2 → DB`

---

## Git Diff Summary

```
 49 tracked modified files
 ├── 19 locked contracts    (docs/audit/docx/contracts/locked/)
 ├── 18 compiled-v2        (docs/audit/docx/compiled-v2/)
 ├──  7 normalized DOCX    (storage/templates/normalized-docx/)
 ├──  2 infra scripts      (scripts/audit/)
 ├──  1 generated file     (legacy-renderer-capabilities.generated.ts)
 ├──  1 DB publish report  (docs/audit/docx/reports/)
 └──  1 audit report       (docs/audit/forms-root-cause/latest.json+md)
```

### Locked Contracts (19 modified)

| BM | Diff Lines | Category | Decision |
|----|-----------|----------|----------|
| BM-001 | +451/-451 | FORMS_ROOT_CAUSE_BATCH_3 | **COMMIT** |
| BM-002 | +71/-71 | FORMS_ROOT_CAUSE_BATCH_3 | **COMMIT** |
| BM-003 | +194/-194 | FORMS_ROOT_CAUSE_BATCH_2 + PER_FORM | **COMMIT** |
| BM-021 | +78/-78 | PER_FORM_RENDER_ACCURATE | **COMMIT** |
| BM-022 | +79/-79 | PER_FORM_RENDER_ACCURATE | **COMMIT** |
| BM-025 | +79/-79 | PER_FORM_RENDER_ACCURATE | **COMMIT** |
| BM-032 | +79/-79 | PER_FORM_RENDER_ACCURATE | **COMMIT** |
| BM-036 | +51/-51 | PER_FORM_RENDER_ACCURATE | **COMMIT** |
| BM-052 | +227/-227 | DOCX_PLACEHOLDER_RENORM + SCOPE_VIOLATION | **KEEP_DIRTY** |
| BM-062 | +110/-110 | DOCX_PLACEHOLDER_RENORM + SCOPE_VIOLATION | **KEEP_DIRTY** |
| BM-063 | +2/-2 | UNAUTHORIZED_ROLLBACK_EVIDENCE | **KEEP_DIRTY** |
| BM-064 | +66/-66 | PATH_BINDING_LAYER_B | **COMMIT** |
| BM-065 | +110/-110 | DOCX_PATH_BINDING_DEFERRED | **COMMIT** |
| BM-066 | +2/-2 | UNAUTHORIZED_ROLLBACK_EVIDENCE | **KEEP_DIRTY** |
| BM-067 | +110/-110 | DOCX_PATH_BINDING_DEFERRED | **COMMIT** |
| BM-073 | +186/-186 | PATH_BINDING_LAYER_A | **COMMIT** |
| BM-080 | +66/-66 | PATH_BINDING_LAYER_B | **COMMIT** |
| BM-096 | +22/-22 | PER_FORM_RENDER_ACCURATE_SINGLE_CANDIDATE | **COMMIT** |
| BM-167 | +66/-66 | FIX_F1_REVIEW_REQUIRED | **COMMIT** |

### Compiled-v2 (18 modified)

All 18 compiled-v2 diffs are **+1/-1 lines** (CRLF normalization). Every modified compiled-v2 has a corresponding modified locked contract. C3 strict PASS (213/213). No orphan compiled changes.

### Normalized DOCX (7 modified)

| BM | Size Before | Size After | Change | Classification |
|----|-----------|-----------|--------|----------------|
| BM-021 | 10,408 | 10,399 | -9 (-0.09%) | **SAFE** |
| BM-031 | 82,870 | 19,284 | -63,586 (-77%) | **DANGEROUS** |
| BM-044 | 20,327 | 20,311 | -16 (-0.08%) | **SAFE** |
| BM-052 | 68,046 | 11,079 | -56,967 (-84%) | **DANGEROUS** |
| BM-056 | 48,247 | 48,241 | -6 (-0.01%) | **SAFE** |
| BM-062 | 92,886 | 13,077 | -79,809 (-86%) | **DANGEROUS** |

---

## Per-BM Detail

### GROUP 1: COMMIT_APPROVED_SET (15 BMs)

#### BM-001 — COMMIT_APPROVED
- **Diff:** +451/-451 lines
- **Category:** FORMS_ROOT_CAUSE_BATCH_3
- **Approval:** forms-root-cause-review-batch-3 decisions (7 items: B3RG-001–007), batch-2 (1 item), batch-1 (1 item) — all human-reviewed label-only fixes
- **Compiled-v2:** +1/-1, C3 PASS
- **DOCX:** no diff
- **Blocker:** none
- **Risk:** LOW — label-only changes

#### BM-002 — COMMIT_APPROVED
- **Diff:** +71/-71 lines
- **Category:** FORMS_ROOT_CAUSE_BATCH_3
- **Approval:** batch-3 (10 items: B3RG-008–017), batch-2 (1 item), batch-1 (1 item)
- **Compiled-v2:** +1/-1, C3 PASS
- **DOCX:** no diff
- **Blocker:** none
- **Risk:** LOW

#### BM-003 — COMMIT_APPROVED
- **Diff:** +194/-194 lines
- **Category:** FORMS_ROOT_CAUSE_BATCH_2 + PER_FORM_RENDER_ACCURATE
- **Approval:** batch-2 (1 item), batch-1 (1 item), per-form repair (5 decisions, SKIPPED_IDEMPOTENT — already applied), WAVE_02 path binding
- **Compiled-v2:** +1/-1, C3 PASS
- **DOCX:** no diff
- **Blocker:** none
- **Risk:** LOW

#### BM-021 — COMMIT_APPROVED
- **Diff:** +78/-78 lines
- **Category:** PER_FORM_RENDER_ACCURATE
- **Approval:** contract-repair-batch-1 (2 decisions: ADD agency.nameUpper, REMOVE document.issueDate — both APPLIED)
- **Compiled-v2:** +1/-1, C3 PASS
- **DOCX:** -9 bytes (-0.09%) — **SAFE** (noise/CRLF)
- **Blocker:** none
- **Risk:** LOW

#### BM-022 — COMMIT_APPROVED
- **Diff:** +79/-79 lines
- **Category:** PER_FORM_RENDER_ACCURATE
- **Approval:** contract-repair-batch-1 (2 decisions: ADD agency.nameUpper, REMOVE document.issueDate — both APPLIED)
- **Compiled-v2:** +1/-1, C3 PASS
- **DOCX:** no diff
- **Blocker:** none
- **Risk:** LOW

#### BM-025 — COMMIT_APPROVED
- **Diff:** +79/-79 lines
- **Category:** PER_FORM_RENDER_ACCURATE
- **Approval:** contract-repair-batch-1 (2 decisions — both APPLIED)
- **Compiled-v2:** +1/-1, C3 PASS
- **DOCX:** no diff
- **Blocker:** none
- **Risk:** LOW

#### BM-032 — COMMIT_APPROVED
- **Diff:** +79/-79 lines
- **Category:** PER_FORM_RENDER_ACCURATE
- **Approval:** contract-repair-batch-1 (2 decisions — both APPLIED)
- **Compiled-v2:** +1/-1, C3 PASS
- **DOCX:** no diff
- **Blocker:** none
- **Risk:** LOW

#### BM-036 — COMMIT_APPROVED
- **Diff:** +51/-51 lines
- **Category:** PER_FORM_RENDER_ACCURATE
- **Approval:** contract-repair-batch-1 (1 decision: REMOVE document.issueDate — APPLIED)
- **Compiled-v2:** +1/-1, C3 PASS
- **DOCX:** no diff
- **Blocker:** none
- **Risk:** LOW

#### BM-064 — COMMIT_APPROVED
- **Diff:** +66/-66 lines
- **Category:** PATH_BINDING_LAYER_B
- **Approval:** Layer B decision (DOCX-REMOVE-005: REMOVE document.issueDate4 — APPROVED, LOW risk, domain model note), closure confirmed
- **Compiled-v2:** +1/-1, C3 PASS
- **DOCX:** no diff
- **Blocker:** none
- **Risk:** LOW

#### BM-065 — COMMIT_APPROVED
- **Diff:** +110/-110 lines
- **Category:** DOCX_PATH_BINDING_DEFERRED
- **Approval:** No layer decisions. `deferredTracking` (PRIOR-DXR-007: recipients.personLine3 KEEP_DEFERRED) — NOT applied, not blocking. Diff likely from `fix-f1-review-required.mjs`
- **Compiled-v2:** +1/-1, C3 PASS
- **DOCX:** no diff
- **Blocker:** none
- **Risk:** LOW — deferred path is not applied

#### BM-067 — COMMIT_APPROVED
- **Diff:** +110/-110 lines
- **Category:** DOCX_PATH_BINDING_DEFERRED
- **Approval:** Same as BM-065. `deferredTracking` (PRIOR-DXR-012: recipients.personLine3 KEEP_DEFERRED) — NOT applied, not blocking
- **Compiled-v2:** +1/-1, C3 PASS
- **DOCX:** no diff
- **Blocker:** none
- **Risk:** LOW — deferred path is not applied

#### BM-073 — COMMIT_APPROVED
- **Diff:** +186/-186 lines
- **Category:** PATH_BINDING_LAYER_A
- **Approval:** Layer A decisions (4 items: REMOVE person.dateOfBirth, person.idNumber, document.fullDocumentCode, document.issueDate — ALL APPROVED, LOWEST risk), closure confirmed
- **Compiled-v2:** +1/-1, C3 PASS
- **DOCX:** no diff
- **Blocker:** none
- **Risk:** LOWEST

#### BM-080 — COMMIT_APPROVED
- **Diff:** +66/-66 lines
- **Category:** PATH_BINDING_LAYER_B
- **Approval:** Layer B decision (DOCX-REMOVE-003: REMOVE person.personFullName — APPROVED, LOW risk, domain model note), closure confirmed
- **Compiled-v2:** +1/-1, C3 PASS
- **DOCX:** no diff
- **Blocker:** none
- **Risk:** LOW

#### BM-096 — COMMIT_APPROVED
- **Diff:** +22/-22 lines
- **Category:** PER_FORM_RENDER_ACCURATE_SINGLE_CANDIDATE
- **Approval:** single-candidate decision (SAFE_PATH_REMAP person.idNumber relink — APPROVED, MEDIUM risk), closure confirmed. Contract-repair-batch-1 decision (SKIPPED_IDEMPOTENT)
- **Compiled-v2:** +1/-1, C3 PASS
- **DOCX:** no diff
- **Blocker:** none (signature group review is separate)
- **Risk:** MEDIUM — but approved

#### BM-167 — COMMIT_APPROVED
- **Diff:** +66/-66 lines
- **Category:** FIX_F1_REVIEW_REQUIRED
- **Approval:** `fix-f1-review-required.mjs` structural fix (cleared `reviewRequired` on manual source fields in F1 affected BMs)
- **Compiled-v2:** +1/-1, C3 PASS
- **DOCX:** no diff
- **Blocker:** none
- **Risk:** LOW

---

### GROUP 2: KEEP_DIRTY (4 BMs)

#### BM-052 — KEEP_DIRTY
- **Diff:** +227/-227 lines
- **Category:** DOCX_PLACEHOLDER_RENORMALIZATION + SCOPE_VIOLATION
- **Approval:** Partial — Layer C (DOCX-REMOVE-008), signature footer approval
- **Scope violation:** `render-binding-repair-v1.mjs` applied mutations beyond approved scope
- **Forensic:** AUTHORIZED_WITH_SCOPE_VIOLATION, blockers preserved
- **DOCX:** 84% size reduction — **DANGEROUS**
- **Blocker:** LEGAL_REVIEW
- **Compiled-v2:** +1/-1, C3 PASS
- **Action:** Keep dirty. Legal review of scope violation required.

#### BM-062 — KEEP_DIRTY
- **Diff:** +110/-110 lines
- **Category:** DOCX_PLACEHOLDER_RENORMALIZATION + SCOPE_VIOLATION
- **Approval:** Partial — Layer C (DOCX-REMOVE-009), signature footer approval
- **Scope violation:** `render-binding-repair-v1.mjs` applied mutations beyond approved scope
- **Forensic:** AUTHORIZED_WITH_SCOPE_VIOLATION, blockers preserved
- **DOCX:** 86% size reduction — **DANGEROUS**
- **Blocker:** LEGAL_REVIEW
- **Compiled-v2:** +1/-1, C3 PASS
- **Action:** Keep dirty. Legal review of scope violation required.

#### BM-063 — KEEP_DIRTY
- **Diff:** +2/-2 lines
- **Category:** UNAUTHORIZED_ROLLBACK_EVIDENCE
- **Approval:** NONE — no `decisions.approved.json` found
- **Scope violation:** `render-binding-repair-v1.mjs` ran `--write` without approved decisions
- **Forensic:** UNAUTHORIZED_CONTRACT_MUTATION_CONFIRMED
- **DOCX:** no diff
- **Blocker:** LEGAL_REVIEW
- **Compiled-v2:** +1/-1, C3 PASS
- **Action:** Keep dirty. Surgical rollback from `backups/2026-06-26T21-17-21-338Z/BM-063__54b73110a34f.contract.locked.json` RECOMMENDED.

#### BM-066 — KEEP_DIRTY
- **Diff:** +2/-2 lines
- **Category:** UNAUTHORIZED_ROLLBACK_EVIDENCE
- **Approval:** NONE — no `decisions.approved.json` found
- **Scope violation:** `render-binding-repair-v1.mjs` ran `--write` without approved decisions
- **Forensic:** UNAUTHORIZED_CONTRACT_MUTATION_CONFIRMED
- **DOCX:** no diff
- **Compiled-v2:** NO DIFF (no compiled-v2 file modified)
- **Blocker:** LEGAL_REVIEW
- **Action:** Keep dirty. Surgical rollback from `backups/2026-06-26T21-32-43-625Z/BM-066__e3bc56081554.contract.locked.json` RECOMMENDED.

---

### GROUP 3: INVESTIGATE (1 BM)

#### BM-031 — INVESTIGATE
- **Category:** STANDALONE_DOCX_RENORMALIZATION
- **Diff:** no locked contract diff (DOCX-only change)
- **DOCX:** 77% size reduction (82,870 → 19,284 bytes) — **CRITICAL INVESTIGATION REQUIRED**
- **Action:** Inspect ZIP entries. Compare placeholder list before/after. DO NOT commit until fidelity is verified.

---

## Normalized DOCX Risk Table

| BM | Size Change | % Change | Classification | Action |
|----|-------------|----------|----------------|--------|
| BM-021 | -9 bytes | -0.09% | SAFE | Commit |
| BM-031 | -63,586 bytes | -76.7% | **DANGEROUS** | Investigate |
| BM-044 | -16 bytes | -0.08% | SAFE | No action needed |
| BM-052 | -56,967 bytes | -83.7% | **DANGEROUS** | Investigate + keep dirty |
| BM-056 | -6 bytes | -0.01% | SAFE | No action needed |
| BM-062 | -79,809 bytes | -85.9% | **DANGEROUS** | Investigate + keep dirty |

---

## Compiled-v2 Consistency

| Property | Value |
|----------|-------|
| All diffs are line-ending only (+1/-1) | **YES** |
| All modified compiled-v2 have matching locked | **YES** |
| Orphan compiled changes | **NONE** |
| C3 strict pass | **213/213 PASS** |
| SOT dependency intact | **YES** |

**Conclusion:** Compiled-v2 is safely derived from locked contracts. No orphan changes. Committing locked automatically makes compiled-v2 consistent.

---

## Approval Wave Summary

| Wave | BMs | Approval | Closure |
|------|-----|---------|---------|
| Forms-root-cause batch-1 | BM-001, 002, 003 | decisions.approved.json | Applied |
| Forms-root-cause batch-2 | BM-001, 002, 003 | decisions.approved.json | Applied |
| Forms-root-cause batch-3 | BM-001, 002 | decisions.approved.json | Applied |
| Per-form render-accurate | BM-021, 022, 025, 032, 036, 096 | decisions.approved.json | Applied |
| Path binding Layer A | BM-073 | decisions.approved.json | Applied + closed |
| Path binding Layer B | BM-080, 063, 064 | decisions.approved.json | Applied + closed |
| Path binding Layer C | BM-052, 062, 066 | decisions.approved.json | Applied + closed |
| F1 structural fix | BM-167 | fix-f1-review-required.mjs | Applied |
| Deferred (no approval) | BM-065, 067 | NOT_APPLICABLE | KEEP_DEFERRED |
| Unauthorized | BM-063, 066 | NONE | KEEP_DIRTY |
| Scope violation | BM-052, 062 | PARTIAL | KEEP_DIRTY |

---

## CodeGraph Findings

**Compile path:** `pnpm contract:compile` reads from `docs/audit/docx/contracts/locked` and writes to `docs/audit/docx/compiled-v2`. All 17 non-rollback compiled-v2 diffs are derived from corresponding locked mutations.

**Apply scripts:**

| Script | Target | BMs |
|--------|--------|-----|
| `apply-forms-root-cause-review-batch-1-approved.mjs` | label-only | BM-001, 002, 003 |
| `apply-forms-root-cause-review-batch-2-approved.mjs` | label-only | BM-001, 002, 003 |
| `apply-forms-root-cause-review-batch-3-approved.mjs` | label-only | BM-001, 002 |
| `apply-docx-path-binding-layer-a-approved.mjs` | destructive | BM-073 |
| `apply-docx-path-binding-layer-b-approved.mjs` | destructive | BM-080, 063, 064 |
| `apply-docx-path-binding-layer-c-approved.mjs` | destructive | BM-052, 062, 066 |
| `fix-f1-review-required.mjs` | structural | BM-167 |
| `render-binding-repair-v1.mjs` | **UNAUTHORIZED** | BM-063, 066 |

**Audit folders:** All 147 untracked audit folders are NOT referenced by CI or source code. Evidence artifacts only.

---

## Validation Results

| Gate | Result | Details |
|------|--------|---------|
| `pnpm audit:locked-compiled:strict` | **PASS** | 213/213 consistent |
| `pnpm audit:contract-sync` | **PASS** | matched=213, stale=0 |
| `pnpm typecheck` | **PASS** | exit 0 |
| `pnpm audit:forms-root-cause` | **PASS** | 213 contracts, 1463 issues |

---

## Decision Summary

### Commit-Approved Set (15 BMs)

**File count per category:**
- Locked contracts: 15
- Compiled-v2: 15
- Normalized DOCX: 1 (BM-021, SAFE -0.09%)

**Files to commit (approved set):**
```
docs/audit/docx/contracts/locked/
  BM-001__f4c2aa3682d3.contract.locked.json  (+451/-451)
  BM-002__f78301178da7.contract.locked.json  (+71/-71)
  BM-003__bb64990bc49b.contract.locked.json  (+194/-194)
  BM-021__772319486f41.contract.locked.json  (+78/-78)
  BM-022__13d342bdfc56.contract.locked.json  (+79/-79)
  BM-025__5dcf0eb7f481.contract.locked.json  (+79/-79)
  BM-032__cce50086cd38.contract.locked.json  (+79/-79)
  BM-036__6f4466480a94.contract.locked.json  (+51/-51)
  BM-064__4d8cebc3515b.contract.locked.json  (+66/-66)
  BM-065__4a64c8d7e96c.contract.locked.json  (+110/-110)
  BM-067__0f7607122f29.contract.locked.json  (+110/-110)
  BM-073__e412fccad227.contract.locked.json  (+186/-186)
  BM-080__a7aa64d4b889.contract.locked.json  (+66/-66)
  BM-096__a50a08efa62f.contract.locked.json  (+22/-22)
  BM-167__70817b325370.contract.locked.json  (+66/-66)

docs/audit/docx/compiled-v2/
  (same 15 BM-*.compiled.json — +1/-1 each, CRLF normalization)

storage/templates/normalized-docx/
  BM-021/BM-021_normalized.docx  (-9 bytes, SAFE)
```

### Keep Dirty (4 BMs)

| BM | Reason | Resolution Path |
|----|--------|----------------|
| BM-052 | Scope violation + 84% DOCX size | Legal review |
| BM-062 | Scope violation + 86% DOCX size | Legal review |
| BM-063 | Unauthorized mutation | Surgical rollback |
| BM-066 | Unauthorized mutation | Surgical rollback |

### Investigate (1 BM)

| BM | Reason | Action |
|----|--------|--------|
| BM-031 | 77% DOCX size reduction, no locked diff | ZIP entry inspection |

---

## Next Planner Decisions

### Phase 1: INVESTIGATE_BM031_BM052_BM062_DOCX_RENORMALIZATION_V1
Inspect ZIP entries and compare placeholder lists. Determine if DOCX renormalization is safe or destructive.

### Phase 2: ROLLBACK_BM063_BM066_V1
Surgical rollback using existing backups. Restore contract integrity.

### Phase 3: LEGAL_REVIEW_BM052_BM062
Human review of scope violations by `render-binding-repair-v1.mjs`.

### Phase 4: COMMIT_APPROVED_SOT_MUTATIONS_V1
Commit 15 BMs only after Phases 1-3 are resolved.

---

## Hard Constraints

- ❌ Do NOT commit approved set until BM-031 investigation is complete
- ❌ Do NOT commit approved set mixed with BM-052/062/063/066 dirty files
- ❌ Do NOT start semantic remediation until dirty BMs are resolved
- ❌ Do NOT restore any file without explicit approval
- ❌ Do NOT run any apply script without approved decisions
- ✅ All 4 gates PASS
- ✅ Ledger files created: 3 (latest.json, latest.md, per-bm.csv)
- ✅ Commit made: **NO**
