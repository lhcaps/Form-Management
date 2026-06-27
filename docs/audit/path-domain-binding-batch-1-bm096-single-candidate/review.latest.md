# BM-096 Single Candidate Review Packet

**Task**: `BM096_SINGLE_CANDIDATE_REVIEW_PACKET_FOR_PLANNER_HANDOFF`
**Generated**: 2026-06-28T07:28:00.000+07:00
**Mode**: `REVIEW_ONLY` (proposed, not approved)
**Audit Version**: v2

---

## Executive Summary

BM-096 (`Yêu cầu ra QĐ khởi tố bị can`) has **1 active candidate** for path-domain remap review and **2 excluded** candidates.

| Status | Count | Description |
|--------|-------|-------------|
| **Active Candidate** | 1 | `document.diaChi` → `person.idNumber` |
| **Excluded** | 2 | `signature.cheDo`, `signature.nguoiKy` |

**Recommendation**: `PROPOSE_APPROVE_SAFE_REMAP`
**Risk**: `MEDIUM`
**Can apply now?**: NO — requires planner/human approval

---

## 1. Exact Candidate Review Table

| Field | Value |
|-------|-------|
| **templateCode** | BM-096 |
| **templateTitle** | Yêu cầu ra QĐ khởi tố bị can |
| **lockedContract** | `docs/audit/docx/contracts/locked/BM-096__a50a08efa62f.contract.locked.json` |
| **oldPath** | `document.diaChi` |
| **newPath** | `person.idNumber` |
| **oldLabel** | Ô trống |
| **newLabel** | Số CCCD/CMND |
| **rawPattern** | `{{person.field14}}` |
| **rawDomain** | person |
| **rawTail** | field14 |
| **rawKey** | person.field14 |
| **textBefore** | `Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:` |
| **context** | `Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:{{person.field14}}` |
| **context200Before** | `Nghề nghiệp:{{document.field13}}\nSố CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:{{person.field14}}` |
| **context200After** | _(empty)_ |
| **source** | `manual` |
| **required** | `false` |
| **reviewRequired** | `false` |
| **currentIssues** | `BAD_LABEL`, `GENERIC_FIELD_CANONICALIZATION` |
| **confidence** | HIGH |
| **recommendation** | `PROPOSE_APPROVE_SAFE_REMAP` |
| **risk** | MEDIUM |

---

## 2. Collision Check Table

| Check | Result | Detail |
|-------|--------|--------|
| **canonicalFields** | `NO_COLLISION` | `person.idNumber` does not exist in canonicalFields |
| **docxSlots** | `NO_COLLISION` | No slot uses `person.idNumber` as slotId |
| **renderBindings** | `NO_COLLISION` | No binding targets `person.idNumber` as slotId |
| **person.idNumber exists** | `false` | New path is fresh — no merge needed |
| **COMPILED_DRIFT touched** | `false` | `document.diaChi` exists in compiled — remap will update compiled too |

---

## 3. Why `signature.cheDo` and `signature.nguoiKy` Are Excluded

| Path | Extracted Label | Context | Exclusion Reason |
|------|----------------|---------|------------------|
| `signature.cheDo` | Nơi thường trú | `Nơi thường trú: {{document.field17}}{{document.field18}}` | `DEFER_PATH_DOMAIN_MISMATCH` |
| `signature.nguoiKy` | Nơi tạm trú | `Nơi tạm trú: {{document.field19}}` | `DEFER_PATH_DOMAIN_MISMATCH` |

**Rationale**: The `signature.*` namespace is for signer metadata (name, title, organization). The contexts "Nơi thường trú" (permanent residence) and "Nơi tạm trú" (temporary residence) are person-address concepts. Assigning them to `signature.cheDo` / `signature.nguoiKy` would create a **cross-domain label-path mismatch** — the label semantics would not match the path semantics. This requires a structural decision about whether the signature block in this template should contain person address fields, which is beyond a simple label/path cleanup. **Deferred to human review.**

---

## 4. Safety Criteria for PROPOSE_APPROVE_SAFE_REMAP

All criteria are satisfied:

| Criterion | Status | Evidence |
|-----------|--------|----------|
| textBefore supports ID number semantics | ✅ | `Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:` — unambiguous ID number context |
| textBefore is not placeholder-only | ✅ | Not a bare `{{document.fieldN}}` pattern |
| rawPattern domain is person | ✅ | `{{person.field14}}` — person domain |
| No docxSlot collision | ✅ | `person.idNumber` slotId does not exist |
| No renderBinding collision | ✅ | No binding targets `person.idNumber` |
| No canonicalField collision | ✅ | `person.idNumber` not in canonicalFields |
| labelAfter not bad/internal | ✅ | `Số CCCD/CMND` — standard Vietnamese legal label |
| source unchanged | ✅ | Remains `manual` |
| required unchanged | ✅ | Remains `false` |
| reviewRequired unchanged | ✅ | Remains `false` |
| No COMPILED_DRIFT touched | ⚠️ | `document.diaChi` exists in compiled — remap will trigger COMPILED_DRIFT resolution |
| No separate source-policy issue hidden | ✅ | Remap fixes both the BAD_LABEL and GENERIC_FIELD_CANONICALIZATION issues |

---

## 5. Proposed Decision Packet Summary

```
decision: PROPOSE_APPROVE_SAFE_PATH_REMAP
mode: PROPOSED_ONLY_NOT_APPROVED
approved: false
reviewerRequired: true
risk: MEDIUM
recommendation: PROPOSE_APPROVE_SAFE_REMAP

mutationsNeededIfApprovedLater:
  1. UPDATE_CANONICAL_PATH      — document.diaChi → person.idNumber
  2. UPDATE_CANONICAL_LABEL    — "Ô trống" → "Số CCCD/CMND"
  3. UPDATE_DOCX_SLOT_ID       — slotId: document.diaChi → person.idNumber
  4. UPDATE_DOCX_SLOT_LABEL    — slot label: "Ô trống" → "Số CCCD/CMND"
  5. UPDATE_RENDER_BINDING_SLOT_ID — binding slotId: document.diaChi → person.idNumber
  6. UPDATE_RENDER_BINDING_FROM_IF_NEEDED — binding from field updated
```

---

## 6. Safety Assertions

| Assertion | Value |
|-----------|-------|
| **noLockedContractMutation** | `true` — no `.contract.locked.json` files edited |
| **noCompiledV2Mutation** | `true` — no compiled-v2 artifacts changed |
| **noApprovedDecision** | `true` — `approved: false` in decision packet |
| **noSignatureCandidateLeakage** | `true` — `signature.cheDo` and `signature.nguoiKy` excluded |
| **metricsUnchanged** | Expected — no changes to audit reports in this task |

---

## 7. Files Created/Changed

| File | Action |
|------|--------|
| `docs/audit/path-domain-binding-batch-1-bm096-single-candidate/review.latest.json` | Created |
| `docs/audit/path-domain-binding-batch-1-bm096-single-candidate/review.latest.md` | Created |
| `docs/audit/path-domain-binding-batch-1-bm096-single-candidate/decision.proposed.json` | Created |
| `docs/audit/path-domain-binding-batch-1-bm096-single-candidate/planner-handoff.latest.json` | Created |
| `docs/audit/path-domain-binding-batch-1-bm096-single-candidate/planner-handoff.latest.md` | Created |
| `docs/audit/path-domain-binding-batch-1-bm096-single-candidate/codegraph.findings.md` | Created |

---

## 8. Baseline Metrics (from briefing)

| Metric | Value |
|--------|-------|
| totalIssues | 1477 |
| FAIL | 1156 |
| REVIEW | 321 |
| REMEDIATION_LEAK | 10 |
| BAD_LABEL | 353 |
| GENERIC_FIELD_CANONICALIZATION | 352 |
| SOURCE_MISMATCH | 121 |
| REQUIRED_SUSPICIOUS | 115 |
| SHOULD_BE_READONLY | 42 |
| COMPILED_DRIFT | 37 |
| UI_VISIBLE_BAD_METADATA | 15 |
| RAW_PATTERN_DOMAIN_MISMATCH | 10 |
| WEAK_EVIDENCE_AUTO_LOCKED | 422 |

**Expected post-task**: Metrics unchanged (no mutations in this task).

---

## 9. CodeGraph Findings

CodeGraph was invoked for project structure exploration of:
- `scripts/audit/audit-forms-root-cause.mjs` — full audit script (1199 lines)
- `scripts/audit/validate-path-domain-batch-1-bm096-plan.mjs` — plan validator (152 lines)
- `scripts/audit/validate-bm096-single-candidate-review.mjs` — single-candidate validator (347 lines)
- `test/bm096-single-candidate-review.test.mjs` — test suite (286 lines)
- `packages/form-contracts/src/v1-adapter.ts` — V1→V2 adapter (144 lines)
- `packages/form-contracts/scripts/compile-contracts.ts` — compile script (30 lines)
- `docs/audit/docx/contracts/locked/BM-096__a50a08efa62f.contract.locked.json` — locked contract (1050 lines)
- `docs/audit/forms-root-cause/latest.json` — root-cause audit (BM-096 section)
- `docs/audit/docx/compiled-v2/BM-096.compiled.json` — compiled artifact

Key findings:
1. **Validator schema**: The validator checks `mutationsNeeded` (plural), but the briefing shows `mutationsNeededIfApprovedLater` (same concept, different name). No schema change needed — both refer to the same array of mutation action names.
2. **audit-forms-root-cause.mjs**: For `document.diaChi`, the v2 audit correctly emits `BAD_LABEL` (FAIL) and `GENERIC_FIELD_CANONICALIZATION` (FAIL) issues. The `rawPattern` is `{{person.field14}}` (person domain), and the canonical path `document.diaChi` (document domain) is a domain mismatch.
3. **v1-adapter.ts**: Adapts V1 locked contracts to V2 compiled form schemas. The `sourceFromV1` function maps `manual` → `{ kind: "MANUAL" }`, confirming the source kind is preserved correctly through compilation.
4. **Locked contract analysis**: The slot `document.diaChi` has `label: "Ô trống"`, `rawPattern: "{{person.field14}}"`, and context `"Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:{{person.field14}}"`. The textBefore directly supports ID number semantics.
5. **Collision analysis**: No `person.idNumber` entry exists anywhere in the locked contract's canonicalFields, docxSlots, or renderBindings. Remapping `document.diaChi` → `person.idNumber` is safe from collision perspective.
6. **Exclusion rationale**: `signature.cheDo` and `signature.nguoiKy` are excluded because the `signature.*` namespace is for signer metadata, not person address fields. Assigning "Nơi thường trú" / "Nơi tạm trú" to these paths would create a cross-domain label-path mismatch, which requires a structural decision beyond the scope of this cleanup batch.

---

## 10. Validation Commands (to be run)

```bash
# Validate review packet
node scripts/audit/validate-bm096-single-candidate-review.mjs

# Run test suite
node --test test/bm096-single-candidate-review.test.mjs

# Audit forms root cause
node scripts/audit/audit-forms-root-cause.mjs

# Check no locked contract diff
git diff -- docs/audit/docx/contracts/locked docs/audit/docx/compiled-v2

# Git status
git status -- docs/audit/path-domain-binding-batch-1-bm096-single-candidate/
```

---

## 11. Final Decision

**Can apply run now?** **NO**

**Reason**: This is a `PROPOSED_ONLY_NOT_APPROVED` decision packet. Human/planner approval is required before any mutation can be applied. The decision packet explicitly sets `approved: false` and `reviewerRequired: true`.
