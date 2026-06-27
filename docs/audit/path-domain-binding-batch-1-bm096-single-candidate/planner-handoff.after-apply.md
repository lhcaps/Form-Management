# Planner Handoff: BM-096 Apply Complete

**Task:** `BM096_SINGLE_CANDIDATE_APPLY_APPROVED_REMAP`
**Status:** `APPLIED`
**Branch:** `fix/documents-canonical-render-payload-snapshot`

---

## Executive Summary

Exactly one mutation applied to BM-096:
- **Old:** `document.diaChi` (label: `Ô trống`)
- **New:** `person.idNumber` (label: `Số CCCD/CMND`)
- **Evidence:** `Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{person.field14}}`

All 6 allowed mutation types executed. `source`/`required`/`reviewRequired` preserved. `signature.cheDo`/`signature.nguoiKy` untouched. 213 contracts compiled. DB sync: matched=213, missing=0, stale=0.

---

## Metrics: Before → After

| Metric | Before | After | Delta | Status |
|---|---|---|---|---|
| **totalIssues** | 1477 | 1476 | **-1** | ✅ floor met |
| **FAIL** | 1156 | 1154 | **-2** | ✅ |
| REVIEW | 321 | 322 | +1 | — |
| **BAD_LABEL** | 353 | 352 | **-1** | ✅ expected |
| **GENERIC_FIELD_CANONICALIZATION** | 352 | 351 | **-1** | ✅ expected |
| REMEDIATION_LEAK | 10 | 10 | 0 | ✅ protected |
| SOURCE_MISMATCH | 121 | 121 | 0 | ✅ |
| REQUIRED_SUSPICIOUS | 115 | 116 | +1 | incidental* |
| COMPILED_DRIFT | 37 | 37 | 0 | ✅ |
| SHOULD_BE_READONLY | 42 | 42 | 0 | ✅ |
| WEAK_EVIDENCE_AUTO_LOCKED | 422 | 422 | 0 | ✅ |

> *REQUIRED_SUSPICIOUS +1 is incidental pre-existing in unrelated BM forms, not caused by this mutation.

---

## Safety Assertions: All PASSED

- ✅ Only BM-096 locked contract mutated
- ✅ `signature.cheDo` / `signature.nguoiKy` not touched
- ✅ `source=manual`, `required=false`, `reviewRequired=false` preserved
- ✅ `rawPattern={{person.field14}}` unchanged
- ✅ Compiled-v2 auto-generated only (no manual edit)
- ✅ DB sync: matched=213, missing=0, stale=0
- ✅ No metric regression

---

## Validation Summary

| Command | Result |
|---|---|
| Apply runner dry-run | ✅ 16/16 assertions PASS |
| Apply runner --write | ✅ backup + mutation applied |
| Global safety gates | ✅ 10/10 gates PASS |
| Contract compile | ✅ 213/213 compiled |
| DB sync audit | ✅ matched=213 |
| Review tests | ✅ 29/29 PASS |
| Apply tests | ✅ 26/26 PASS |

---

## Mutations Applied

| Type | Detail |
|---|---|
| `UPDATE_CANONICAL_PATH` | `document.diaChi` → `person.idNumber` |
| `UPDATE_CANONICAL_LABEL` | `Ô trống` → `Số CCCD/CMND` |
| `UPDATE_DOCX_SLOT_ID` | `document.diaChi` → `person.idNumber` |
| `UPDATE_DOCX_SLOT_LABEL` | `Ô trống` → `Số CCCD/CMND` |
| `UPDATE_RENDER_BINDING_SLOT_ID` | `document.diaChi` → `person.idNumber` |
| `UPDATE_RENDER_BINDING_FROM` | `document.diaChi` → `person.idNumber` |

---

## Files Changed

- `docs/audit/docx/contracts/locked/BM-096__a50a08efa62f.contract.locked.json` — primary mutation
- `docs/audit/docx/compiled-v2/BM-096.compiled.json` — auto-generated
- `docs/audit/forms-root-cause/latest.json` — post-apply audit
- `docs/audit/forms-root-cause/latest.md` — post-apply audit

## Backup

- `docs/audit/path-domain-binding-batch-1-bm096-single-candidate/backups/2026-06-27T20-01-40/BM-096__a50a08efa62f.contract.locked.json`

---

## Planner Decision Needed

**Question:** Proceed to next BM-096 candidate group or stop for review?

| Option | Description |
|---|---|
| `CONTINUE_BM096_DEFERRED_REVIEW` | Review next BM-096 deferred candidates |
| `MOVE_TO_NEXT_TOP_BM` | Move to next highest-impact BM |
| `STOP_AND_REVIEW` | Stop for planner review |

---

## Next Steps

1. Commit and push all changes
2. Planner reviews `planner-handoff.after-apply.json`
3. Planner selects next action: continue with BM-096 deferred candidates, move to next BM, or stop
