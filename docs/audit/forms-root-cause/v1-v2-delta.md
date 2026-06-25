# v1 to v2 Delta Report

Generated: 2026-06-26

## Summary

| Metric | v1 | v2 | Delta |
|--------|----|----|-------|
| totalIssues | 1,567 | 3,480 | +1,913 |
| FAIL | 603 | 1,886 | +1,283 |
| REVIEW | 964 | 1,594 | +630 |
| totalContracts | 213 | 213 | 0 |
| totalFields | 2,453 | 2,453 | 0 |

## Issue Counts by Category

| Issue Code | v1 | v2 | Delta | Notes |
|------------|----|----|-------|-------|
| BAD_LABEL | 499 | 499 | 0 | Unchanged (was already running independently) |
| RAW_PATTERN_DOMAIN_MISMATCH | 171 | 323 | +152 | Rule now runs for all fields, not gated by BAD_LABEL |
| SOURCE_MISMATCH | 20 | 339 | +319 | Major fix: rule considers rawPattern domain vs source + context together |
| WEAK_EVIDENCE_AUTO_LOCKED | 0 | 422 | **+422** | Was short-circuited by BAD_LABEL check - now runs on all fields |
| GENERIC_FIELD_CANONICALIZATION | 0 | 388 | **+388** | Was short-circuited by BAD_LABEL check - now runs on all fields |
| UI_VISIBLE_BAD_METADATA | 0 | 96 | **+96** | Was suppressed by BAD_LABEL - now explicit, no duplicate suppression |
| COMPILED_DRIFT | 765 | 765 | 0 | Unchanged (was already independent) |
| REQUIRED_SUSPICIOUS | 39 | 114 | +75 | Was inside BAD_LABEL gate - now runs independently |
| SHOULD_BE_READONLY | 0 | 461 | **+461** | Was inside BAD_LABEL gate - now runs on all fields, logic enhanced |
| REMEDIATION_LEAK | 73 | 73 | 0 | Unchanged (was already independent) |

## Root Cause of Delta

The primary cause of the ~2,000 issue increase is the **rule short-circuit bug** in v1:

```javascript
// v1 (buggy): all rules after BAD_LABEL were inside this gate
for (const field of canonicalFields) {
  const { bad, reason } = isBadLabel(field.label, field.path);
  if (!bad) continue;  // <-- THIS caused rules to skip fields with good labels

  // Rules 2-9 only ran for bad-label fields
  // Fields with good labels but bad source/rawPattern/required/readonly were missed
}
```

```javascript
// v2 (fixed): each rule runs independently for every field
for (const field of canonicalFields) {
  // Rule 1: BAD_LABEL - independent
  // Rule 2: RAW_PATTERN_DOMAIN_MISMATCH - always runs
  // Rule 3: SOURCE_MISMATCH - always runs (with enhanced logic)
  // Rule 4: WEAK_EVIDENCE_AUTO_LOCKED - always runs
  // Rule 5: GENERIC_FIELD_CANONICALIZATION - always runs
  // Rule 8: REQUIRED_SUSPICIOUS - always runs
  // Rule 9: SHOULD_BE_READONLY - always runs (enhanced logic)
}
```

## Newly Discovered Issue Breakdown

### WEAK_EVIDENCE_AUTO_LOCKED (+422)
Previously showed 0 because it was gated by BAD_LABEL. Now flags:
- Fields with `reviewRequired=false`
- AND generic rawPattern (fieldN)
- AND short/auto-generated context

Common pattern: `{{document.field1}}` + `[Auto-generated]` + `reviewRequired=false`

### GENERIC_FIELD_CANONICALIZATION (+388)
Previously showed 0 because it was gated by BAD_LABEL. Now flags:
- Generic raw patterns mapped to semantic paths
- Where label is bad OR evidence is weak

### SHOULD_BE_READONLY (+461)
Previously showed 0 because it was inside the BAD_LABEL gate. Now flags:
- `document.fullDocumentCode`, `document.issuePlaceDateLine` with source=manual
- `agency.nameUpper`, `agency.parentNameUpper` with source=agencyConfig
- `legalBasis.procedureArticlesLine` with source=manual
- `signature.signDate` with source=manual

### UI_VISIBLE_BAD_METADATA (+96)
Previously showed 0 because it was suppressed by BAD_LABEL duplicate check. Now:
- Explicitly emits UI_VISIBLE_BAD_METADATA for every visible field with bad label
- Does not suppress even if BAD_LABEL already caught the same field

### SOURCE_MISMATCH (+319)
Enhanced logic now catches:
- `source=agencyConfig` + path is decision/document/person (not just domain mismatch)
- `source=agencyConfig` + rawPattern domain is decision/document/person
- `source=manual` + context is fixed legal text

### RAW_PATTERN_DOMAIN_MISMATCH (+152)
Now runs for all fields (good and bad labels). Previously only ran for bad-label fields.

## BM-050 and BM-068 Issue Count Changes

### BM-050
- v1: ~10 issues (reported)
- v2: 23 issues total (10 FAIL, 13 REVIEW)
- New in v2: SHOULD_BE_READONLY issues, UI_VISIBLE_BAD_METADATA, full SOURCE_MISMATCH coverage

### BM-068
- v1: ~35 issues (reported)
- v2: 36 issues total (30 FAIL, 6 REVIEW)
- New in v2: SHOULD_BE_READONLY, UI_VISIBLE_BAD_METADATA for visible fields

## Validation

| Check | Result |
|-------|--------|
| smoke tests (14/14) | PASS |
| `pnpm audit:forms-root-cause` | PASS (exit 0) |
| `pnpm audit:forms-root-cause:strict` | exit 1 (1,886 FAIL issues) |
| `pnpm --filter @qllaw/form-contracts test` | PASS |
| `pnpm typecheck` | PASS |

## Interpretation for Fix Planning

The v2 report is now reliable for fix planning. The ~2,000 new issues are real issues that v1 missed due to the short-circuit bug. The fix plan should use the v2 data.

Categories to prioritize for auto-fix:
- BAD_LABEL with HIGH confidence (499)
- RAW_PATTERN_DOMAIN_MISMATCH with HIGH confidence (323)
- GENERIC_FIELD_CANONICALIZATION with HIGH confidence
- WEAK_EVIDENCE_AUTO_LOCKED with HIGH confidence (422)

Categories requiring human review:
- SOURCE_MISMATCH (339) - context-dependent
- SHOULD_BE_READONLY (461) - system vs manual judgment
- REMEDIATION_LEAK (73) - Wave 02 slot review needed
- COMPILED_DRIFT (765) - requires understanding of locked vs compiled intent
