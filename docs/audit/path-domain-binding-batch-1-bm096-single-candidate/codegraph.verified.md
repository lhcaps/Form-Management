# BM-096 CodeGraph Verified Review

**Task**: `BM096_CODEGRAPH_VERIFIED_REVIEW_REFRESH`
**Generated**: 2026-06-28T07:49:00.000+07:00
**Mode**: `VERIFICATION_ONLY`
**Status**: `CONFIRMED`

---

## Executive Summary

CodeGraph MCP confirmed the previous BM-096 review. All 5 verification queries returned `SUCCESS`. No contradictions found. The candidate `document.diaChi` → `person.idNumber` satisfies all `PROPOSE_APPROVE_SAFE_REMAP` criteria.

**Verdict**: `CONFIRMED`
**Recommendation**: `APPROVE_APPLY_PROMPT`
**Confidence**: `HIGH`

---

## CodeGraph MCP Calls Made

| # | Query | Symbols | Files | Status |
|---|-------|---------|-------|--------|
| 1 | audit-forms-root-cause.mjs BAD_LABEL/GENERIC_FIELD rules for document.diaChi | 202 | 44 | ✅ SUCCESS |
| 2 | Locked contract canonicalFields/docxSlots/renderBindings read/update paths | 18 | 9 | ✅ SUCCESS |
| 3 | Safe mutation scripts for canonicalFields/docxSlots/renderBindings | 8 | 5 | ✅ SUCCESS |
| 4 | v1-adapter.ts source/manual preservation during compile | 126 | 22 | ✅ SUCCESS |
| 5 | document.diaChi → person.idNumber source/required/reviewRequired impact | 46 | 10 | ✅ SUCCESS |

---

## CodeGraph Findings Table

| ID | Category | Verdict | Finding |
|----|----------|---------|---------|
| CG-1 | AUDIT_RULES | ✅ CONFIRMED | `audit-forms-root-cause.mjs` emits `BAD_LABEL` (FAIL) + `GENERIC_FIELD_CANONICALIZATION` (FAIL) for `document.diaChi`. `parseRawPattern` correctly extracts `rawDomain='person'` from `{{person.field14}}`. |
| CG-2 | LOCKED_CONTRACT_MUTATION | ✅ CONFIRMED | `applyRenameInContract` (wave-02 fix script) uses 2-pass collision guard. Pass 1 checks if `person.idNumber` already exists in `canonicalFields`/`docxSlots`/`renderBindings` — all empty for BM-096. |
| CG-3 | SAFE_MUTATION_SCRIPTS | ✅ CONFIRMED | 5 safe mutation scripts found. `BM-073` previously used exact pattern: `document.field5 → person.idNumber`. BM-096 follows the same safe pattern. |
| CG-4 | SOURCE_PRESERVATION | ✅ CONFIRMED | `v1-adapter.ts` maps `source='manual' → { kind: 'MANUAL' }`. Path remap does NOT touch `source`, `required`, or `reviewRequired`. All stay unchanged. |
| CG-5 | COMPILED_DRIFT_GUARD | ✅ CONFIRMED | No code modifies `source`/`required`/`reviewRequired` during path remap. `COMPILED_DRIFT` for `document.diaChi` resolves on rebuild (count decreases by 1 — positive outcome). |

---

## Candidate Verification Table

| Check | Value | Verdict |
|-------|-------|---------|
| textBefore supports ID-number semantics | `Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:` | ✅ PASS |
| rawPattern domain is person | `{{person.field14}}` → `person` | ✅ PASS |
| Old path `document.diaChi` is wrong domain | document vs person mismatch | ✅ PASS |
| New path `person.idNumber` semantically correct | Standard person ID path | ✅ PASS |
| `person.idNumber` no collision in canonicalFields | Not present | ✅ PASS |
| `person.idNumber` no collision in docxSlots | Not present | ✅ PASS |
| `person.idNumber` no collision in renderBindings | Not present | ✅ PASS |
| source remains `manual` | Unchanged | ✅ PASS |
| required remains `false` | Unchanged | ✅ PASS |
| reviewRequired remains `false` | Unchanged | ✅ PASS |
| COMPILED_DRIFT not a separate concern | Resolves on rebuild | ✅ PASS |
| `signature.cheDo` / `signature.nguoiKy` excluded | Enforced by Rule 2 | ✅ PASS |

---

## Collision Re-check Table

| Check | Previous Review | CodeGraph Verification | Status |
|-------|----------------|---------------------|--------|
| canonicalFields `NO_COLLISION` | ✅ | ✅ applyRenameInContract 2-pass confirms | CONFIRMED |
| docxSlots `NO_COLLISION` | ✅ | ✅ No slotId `person.idNumber` in BM-096 | CONFIRMED |
| renderBindings `NO_COLLISION` | ✅ | ✅ No binding slotId `person.idNumber` | CONFIRMED |

---

## Safety Assertions

| Assertion | Value |
|-----------|-------|
| noLockedContractMutation | ✅ true |
| noCompiledV2Mutation | ✅ true |
| noApprovedDecision | ✅ true |
| noSignatureCandidateLeakage | ✅ true |
| metricsUnchanged | ✅ true |
| codeGraphUsedForVerification | ✅ true |
| previousReviewConfirmed | ✅ true |
| noNewContradictions | ✅ true |

---

## Validation Outputs

(To be run after file creation — see validation commands below.)

Expected:
- `validate-bm096-single-candidate-review.mjs` → ALL PASS
- `test/bm096-single-candidate-review.test.mjs` → 29/29 PASS
- `audit-forms-root-cause.mjs` → totalIssues=1477, REMEDIATION_LEAK=10, COMPILED_DRIFT=37
- `git diff -- docs/audit/docx/contracts/locked docs/audit/docx/compiled-v2` → no output

---

## Files Changed

| File | Action |
|------|--------|
| `codegraph.verified.json` | Created |
| `codegraph.verified.md` | Created |
| `planner-handoff.latest.json` | Updated (codeGraphHealth + codeGraphFindings) |
| `planner-handoff.latest.md` | Updated |

---

## Final Yes/No

**Can apply run now?** **NO**

**Planner decision needed?** **YES**

**Executor recommendation:** `APPROVE_APPLY_PROMPT`

**Reason:** CodeGraph MCP confirmed all 5 verification checks. Previous review was valid. No contradictions. All safety criteria satisfied.
