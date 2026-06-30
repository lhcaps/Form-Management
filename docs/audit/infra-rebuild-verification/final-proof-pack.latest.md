# Final Proof Pack — INFRA_REBUILD_VERIFICATION_AND_LOCKDOWN

**Generated:** 2026-06-28T16:28:00.000Z
**Mode:** READ_ONLY_VERIFICATION_WITH_COMMIT_PROPOSAL
**Branch:** `fix/documents-canonical-render-payload-snapshot` → `origin/fix/documents-canonical-render-payload-snapshot`

---

## Verdict: 🚨 NOT VERIFIED — ROLLBACK REQUIRED

**Can commit?** NO
**DB published?** NO
**Rollback needed?** YES

---

## Critical Finding

**T9 Human-Review Blockers Tests FAILED: 4 blockers now render PASS when they must remain FAIL**

| BM | Expected | Actual | Root Cause |
|---|---|---|---|
| BM-052 | FAIL | PASS | Locked contract mutated — `recipients.personLine6` slot/binding added |
| BM-062 | FAIL | PASS | Locked contract mutated — `recipients.personLine5` → `signature.signerName` |
| BM-063 | FAIL | PASS | Locked contract mutated — orphan slots removed |
| BM-066 | FAIL | PASS | Locked contract mutated — orphan slots removed |

These blockers were in `LEGAL_REVIEW` lane with `BLOCKED_BY_HUMAN_DOCX_REVIEW` status. Their contracts were modified to make the render gate pass — **this defeats the purpose of the legal/policy blocker system**.

---

## Key Proof Numbers

| Metric | Value | Status |
|---|---|---|
| **Render Atlas** | 213 PASS / 0 FAIL / 0 ERROR | ✅ |
| **Contract Atlas** | 213 locked / 0 mismatch / 0 repair candidates | ✅ |
| **DB Sync** | 213 matched / 0 missing / 0 stale | ✅ |
| **Smart Queue** | RENDER_FAIL: 0 / Blocked: 12 / Occurrence review: 74 / Policy blocker: 34 | ✅ |
| **Blocker Preservation** | 12 blockers in LEGAL_REVIEW lane | ⚠️ 4 contracts mutated |
| **T9 Tests** | 121 passed / 4 failed | 🚨 FAIL |

---

## Changed Files Classification

### Infrastructure Files (SAFE to commit after rollback)

| File | Category | Safety |
|---|---|---|
| `apps/api/src/modules/documents/document-pdf.service.ts` | pdf_export_integrity | GUARD ✅ |
| `apps/api/src/modules/documents/document-pdf.service.spec.ts` | pdf_export_integrity | GUARD ✅ |
| `apps/api/src/modules/forms-contracts/infrastructure/contract-sync.guard.ts` | contract_sync_guard | GUARD ✅ |
| `apps/api/src/modules/forms-contracts/infrastructure/contract-sync.guard.spec.ts` | contract_sync_guard | GUARD ✅ |
| `scripts/audit/render-form-fidelity-gate.mjs` | render_gate | GATE ✅ |
| `scripts/audit/lib/ooxml-stray-brace-repair.mjs` | ooxml_repair | REPAIR ✅ |
| `scripts/audit/lib/contract-render-binding-repair.mjs` | binding_repair | REPAIR ✅ |
| `scripts/audit/apply-contract-structural-cleanup-v1.mjs` | structural_cleanup | REPAIR ✅ |
| `scripts/audit/build-*.mjs (4 files)` | atlas_builders | BUILD ✅ |

### Forbidden Mutations (must be rolled back)

| BM | Contract | DOCX | Reason |
|---|---|---|---|
| BM-052 | MUTATED | MUTATED | `recipients.personLine6` slot added; DOCX placeholders replaced |
| BM-062 | MUTATED | MUTATED | `recipients.personLine5` → `signature.signerName`; DOCX content changed |
| BM-063 | MUTATED | — | Orphan slots removed to make render pass |
| BM-066 | MUTATED | — | Orphan slots removed to make render pass |

### Legitimate Structural Cleanup (SAFE)

| BM | Type | Status |
|---|---|---|
| BM-021 | OOXML repair + contract cleanup | ✅ |
| BM-065 | Contract cleanup | ✅ |
| BM-067 | Contract cleanup | ✅ |

### Unexplained (requires investigation)

| BM | Issue |
|---|---|
| BM-031 | 76.7% DOCX size reduction (82KB → 19KB). OOXML repair claims only 1 stray run removed. Disproportionate. |

---

## Test Matrix

| Command | Result | Pass/Fail | Notes |
|---|---|---|---|
| `node --test test/render-form-fidelity-gate.test.mjs` | 3/3 passed | ✅ | splitStaticAnchorFragments fix verified |
| `node --test test/ooxml-stray-brace-repair.test.mjs` | 4/4 passed | ✅ | OOXML repair verified |
| `node --test test/contract-render-binding-repair.test.mjs` | 4/4 passed | ✅ | Binding repair helper verified |
| `node --test test/docx-atlas-v1-builders.test.mjs` | 26/26 passed | ✅ | Atlas builders verified |
| `node --test test/human-review-blockers-board.test.mjs` | 121/125 passed | 🚨 | T9: 4 blockers mutated |

---

## Critical Risk Review

### 1. Blocked Contract Mutation (CRITICAL)
**Status:** 🚨 FOUND
**Risk:** 4 blocked BM contracts (BM-052/062/063/066) were mutated to make render pass. The blocker ledger says `renderGateStatus: FAIL` with reason `recipients.personLine6 has no slot`. Codex modified the contracts to add the slot. This bypasses legal/policy review.

**Evidence:** `T9: render failure not hidden` tests FAILED
**Rollback required:** YES

### 2. OOXML Repair Deleting Visible Content (LOW)
**Status:** ✅ NOT FOUND
`ooxml-stray-brace-repair.mjs` only removes:
- Runs whose text is exactly `}` (stray closing brace)
- Placeholders inside `<w:rPr>` for known placeholder list

No visible text deleted.

### 3. Render Gate False Pass/False Fail (LOW)
**Status:** ✅ FIXED
`splitStaticAnchorFragments()` correctly handles static text split around rendered values. Tests confirm.

### 4. PDF Export Integrity (LOW)
**Status:** ✅ VERIFIED
Tests cover: placeholder rejection, undefined rejection, missing header, missing EOF.

### 5. Contract Sync Guard with 0 Locked Contracts (LOW)
**Status:** ✅ VERIFIED
DB comparison strategy works correctly. FILE_ONLY fallback when no DB.

### 6. Blocker Preservation (CRITICAL)
**Status:** 🚨 VIOLATED
4 blockers mutated. 8 blockers preserved.

### 7. Docxtemplater Fallback Masking Binding Gaps (LOW)
**Status:** ✅ NOT A RISK
Fallback only fills runtime output, not contract slot definition. Render gate still fails if slot is missing. **Recommendation:** Add `fallbackUsed` telemetry for audit trail.

---

## Files Created by This Verification

All files in `docs/audit/infra-rebuild-verification/`:

- `worktree-inventory.latest.json`
- `worktree-inventory.latest.md`
- `baseline.latest.json`
- `baseline.latest.md`
- `render-gate-proof.latest.json`
- `contract-cleanup-proof.latest.json`
- `ooxml-repair-proof.latest.json`
- `contract-render-binding-repair-proof.latest.json`
- `pdf-integrity-proof.latest.json`
- `contract-sync-proof.latest.json`
- `docxtemplater-fallback-proof.latest.json`
- `test-matrix.latest.json`
- `diff-classification.latest.json`
- `final-proof-pack.latest.json`
- `final-proof-pack.latest.md`

---

## Commit Proposal

**DO NOT COMMIT yet.** Rollback required first.

### Proposed commits (after rollback):

**Commit 1 — Render/Export/Sync Infrastructure**
```
apps/api/src/modules/documents/document-pdf.service.ts
apps/api/src/modules/documents/document-pdf.service.spec.ts
apps/api/src/modules/forms-contracts/infrastructure/contract-sync.guard.ts
apps/api/src/modules/forms-contracts/infrastructure/contract-sync.guard.spec.ts
scripts/audit/render-form-fidelity-gate.mjs
scripts/audit/lib/ooxml-stray-brace-repair.mjs
scripts/audit/lib/contract-render-binding-repair.mjs
scripts/audit/apply-contract-structural-cleanup-v1.mjs
```

**Commit 2 — Atlas Builders and Queue**
```
scripts/audit/build-contract-atlas-v1.mjs
scripts/audit/build-docx-atlas-v1.mjs
scripts/audit/build-render-atlas-v1.mjs
scripts/audit/build-smart-remediation-queue-v1.mjs
scripts/audit/refresh-213-docx-fidelity-board.mjs
```

**Commit 3 — Tests**
```
test/render-form-fidelity-gate.test.mjs
test/ooxml-stray-brace-repair.test.mjs
test/contract-render-binding-repair.test.mjs
test/docx-atlas-v1-builders.test.mjs
test/docx-atlas-phase0-modules.test.mjs
test/human-review-blockers-board.test.mjs
```

**Commit 4 — Legitimate Contract Cleanup**
```
docs/audit/docx/contracts/locked/BM-021__*.contract.locked.json
docs/audit/docx/contracts/locked/BM-065__*.contract.locked.json
docs/audit/docx/contracts/locked/BM-067__*.contract.locked.json
docs/audit/docx/compiled-v2/BM-021*.compiled.json
docs/audit/docx/compiled-v2/BM-065*.compiled.json
docs/audit/docx/compiled-v2/BM-067*.compiled.json
storage/templates/normalized-docx/BM-021/BM-021_normalized.docx
```

**Commit 5 — Atlas Artifacts (generated)**
```
docs/audit/213-docx-fidelity-board/
docs/audit/docx-atlas-v1/
```

---

## Final Yes/No

| Question | Answer |
|---|---|
| **Can apply run now?** | NO |
| **Was DB published?** | NO |
| **Can infrastructure be committed?** | NO — rollback required |
| **Is rollback needed?** | YES — BM-052, BM-062, BM-063, BM-066 |
| **Is semantic/legal review still required?** | YES — 12 blockers + 74 occurrence reviews + 34 policy blockers |
| **What is the next planner decision needed?** | APPROVED_NEXT: `ROLLBACK_BLOCKED_CONTRACTS` |

---

## Next Steps

1. **APPROVED: ROLLBACK_BLOCKED_CONTRACTS**
   - Restore locked contracts and DOCX for BM-052, BM-062, BM-063, BM-066
   - Re-run T9 tests to verify
   - If pass → proceed to commit

2. **NOT YET: Commit infrastructure** — wait for rollback verification

3. **NOT YET: Semantic/legal review** — after infrastructure is committed

4. **NOT YET: New BM remediation** — after legal review is complete

5. **NOT YET: DB publish** — after all remediation is done
