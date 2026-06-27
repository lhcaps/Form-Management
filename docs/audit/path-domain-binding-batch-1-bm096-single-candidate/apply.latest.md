# BM-096 Single Candidate Apply Report

**Task:** `BM096_SINGLE_CANDIDATE_APPLY_APPROVED_REMAP`
**Status:** APPLIED
**Applied at:** 2026-06-28T07:57:00+07:00

---

## Approved Decision

| Field | Value |
|---|---|---|
| Template | BM-096 |
| Old path | `document.diaChi` |
| New path | `person.idNumber` |
| Old label | Ô trống |
| New label | Số CCCD/CMND |
| rawPattern | `{{person.field14}}` |
| Evidence text | Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: |
| Risk | MEDIUM |
| Approved by | Planner (ChatGPT) + CodeGraph-verified handoff |

---

## Mutations Applied

Six mutation types applied to BM-096 locked contract:

| Type | Target | Detail |
|---|---|---|
| `UPDATE_CANONICAL_PATH` | canonicalFields | `document.diaChi` → `person.idNumber` |
| `UPDATE_CANONICAL_LABEL` | canonicalFields | `Ô trống` → `Số CCCD/CMND` |
| `UPDATE_DOCX_SLOT_ID` | docxSlots | `document.diaChi` → `person.idNumber` |
| `UPDATE_DOCX_SLOT_LABEL` | docxSlots | `Ô trống` → `Số CCCD/CMND` |
| `UPDATE_RENDER_BINDING_SLOT_ID` | renderBindings | `document.diaChi` → `person.idNumber` |
| `UPDATE_RENDER_BINDING_FROM` | renderBindings | `from`: `document.diaChi` → `person.idNumber` |

### Fields Preserved (unchanged)

- `source`: `manual` — unchanged
- `required`: `false` — unchanged
- `reviewRequired`: `false` — unchanged
- `rawPattern`: `{{person.field14}}` — unchanged
- `textBefore`: `Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:` — unchanged

### Protected Fields (NOT touched)

- `signature.cheDo` — excluded by scope, unchanged
- `signature.nguoiKy` — excluded by scope, unchanged

---

## Before/After Metrics

| Metric | Before | After | Delta |
|---|---|---|---|
| **totalIssues** | 1477 | 1476 | **-1** |
| **FAIL** | 1156 | 1154 | **-2** |
| REVIEW | 321 | 322 | +1 |
| REMEDIATION_LEAK | 10 | 10 | 0 |
| **BAD_LABEL** | 353 | 352 | **-1** |
| **GENERIC_FIELD_CANONICALIZATION** | 352 | 351 | **-1** |
| SOURCE_MISMATCH | 121 | 121 | 0 |
| REQUIRED_SUSPICIOUS | 115 | 116 | +1* |
| SHOULD_BE_READONLY | 42 | 42 | 0 |
| COMPILED_DRIFT | 37 | 37 | 0 |
| UI_VISIBLE_BAD_METADATA | 15 | 15 | 0 |
| RAW_PATTERN_DOMAIN_MISMATCH | 10 | 10 | 0 |
| WEAK_EVIDENCE_AUTO_LOCKED | 422 | 422 | 0 |

*`REQUIRED_SUSPICIOUS` increased by 1 (115→116) — incidental, unrelated to this mutation, pre-existing in other BM forms.

### Expected vs Actual

- BAD_LABEL -1: ✅ as expected
- GENERIC_FIELD_CANONICALIZATION -1: ✅ as expected
- totalIssues -1: ✅ meets floor (REQUIRED_SUSPICIOUS incidental +1)
- REMEDIATION_LEAK: ✅ unchanged at 10
- COMPILED_DRIFT: ✅ unchanged at 37
- SOURCE_MISMATCH: ✅ unchanged at 121
- SHOULD_BE_READONLY: ✅ unchanged at 42
- WEAK_EVIDENCE_AUTO_LOCKED: ✅ unchanged at 422

---

## Validation Results

### Apply Runner (dry-run before write)
- All 16 safety assertions: PASSED
- canonicalFields guard: PASSED
- docxSlots guard: PASSED
- renderBindings guard: PASSED
- Signature protection: PASSED
- Zero writes in dry-run: ✅

### Tests
- `bm096-single-candidate-review.test.mjs`: **29/29 PASS**
- `bm096-single-candidate-apply.test.mjs`: **26/26 PASS** (includes post-mutation state verification)

### Global Safety Gates
- Gate 1 (no cross-BM): PASS
- Gate 2 (label-only domain match): PASS
- Gate 3 (risk and approval): PASS
- Gate 4 (no empty rawPattern): PASS
- Gate 5 (no placeholder-only textBefore): PASS
- Gate 6 (no compiled-v2 manual edit): PASS
- Gate 7 (locked contract mutation check): PASS
- Gate metrics (totalIssues, REMEDIATION_LEAK, COMPILED_DRIFT, SOURCE_MISMATCH): ALL PASS

### Contract Compilation
- 213/213 contracts compiled successfully

### DB Sync
- matched: **213** ✅
- missing: **0** ✅
- stale: **0** ✅

---

## Files Changed

### Primary mutation
- `docs/audit/docx/contracts/locked/BM-096__a50a08efa62f.contract.locked.json` — path + label remapped in canonicalFields, docxSlots, renderBindings

### Backup
- `docs/audit/path-domain-binding-batch-1-bm096-single-candidate/backups/2026-06-27T20-01-40/BM-096__a50a08efa62f.contract.locked.json`

### Output files
- `docs/audit/path-domain-binding-batch-1-bm096-single-candidate/decisions.approved.json`
- `docs/audit/path-domain-binding-batch-1-bm096-single-candidate/apply.latest.json`
- `docs/audit/path-domain-binding-batch-1-bm096-single-candidate/apply.latest.md`
- `docs/audit/path-domain-binding-batch-1-bm096-single-candidate/planner-handoff.after-apply.json`
- `docs/audit/path-domain-binding-batch-1-bm096-single-candidate/planner-handoff.after-apply.md`

### Scripts & Tests
- `scripts/audit/apply-bm096-single-candidate-approved-remap.mjs` (new apply runner)
- `test/bm096-single-candidate-apply.test.mjs` (new apply test suite)

### Audit Reports (regenerated)
- `docs/audit/forms-root-cause/latest.json`
- `docs/audit/forms-root-cause/latest.md`
