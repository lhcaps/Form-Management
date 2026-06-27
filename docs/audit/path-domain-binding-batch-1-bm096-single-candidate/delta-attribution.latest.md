# BM-096 Apply Delta Attribution Report

**Task:** `BM096_APPLY_DELTA_ATTRIBUTION_REVIEW`
**Generated:** 2026-06-27T20:25:22.012Z

## Mutation

| Field | Value |
|---|---|
| Template | BM-096 |
| Old path | `document.diaChi` |
| New path | `person.idNumber` |
| Old label | Ô trống |
| New label | Số CCCD/CMND |

## Issue Delta (exact rows)

### Removed Issues

| Template | Path | Code | Severity | Reason |
|---|---|---|---|---|
| BM-096 | `document.diaChi` | BAD_LABEL | FAIL | Canonical field label is "Ô trống" ("Ô trống"). This will ap |
| BM-096 | `document.diaChi` | GENERIC_FIELD_CANONICALIZATION | FAIL | Generic raw pattern "{{person.field14}}" mapped to "document |

### Added Issues

| Template | Path | Code | Severity | Reason |
|---|---|---|---|---|
| BM-096 | `person.idNumber` | REQUIRED_SUSPICIOUS | REVIEW | Field looks required (ID field likely required) but required |

## Metrics

| Metric | Before | After | Delta |
|---|---|---|---|
| totalIssues | 1477 | 1476 | -1 |
| FAIL | 1156 | 1154 | -2 |
| REVIEW | 321 | 322 | +1 |
| BAD_LABEL | 353 | 352 | -1 |
| GENERIC_FIELD_CANONICALIZATION | 352 | 351 | -1 |
| REQUIRED_SUSPICIOUS | 115 | 116 | +1 |
| SOURCE_MISMATCH | 121 | 121 | +0 |
| COMPILED_DRIFT | 37 | 37 | +0 |
| REMEDIATION_LEAK | 10 | 10 | +0 |
| SHOULD_BE_READONLY | 42 | 42 | +0 |
| WEAK_EVIDENCE_AUTO_LOCKED | 422 | 422 | +0 |
| RAW_PATTERN_DOMAIN_MISMATCH | 10 | 10 | +0 |
| UI_VISIBLE_BAD_METADATA | 15 | 15 | +0 |

## REQUIRED_SUSPICIOUS Attribution

**Net delta:** 1
**Assessment:** INCREASE: newly surfaced on 1 issue(s)
**BM-096 mutation caused?** YES (unmasking)

**New BM-096 issue:**

- Path: `person.idNumber` in BM-096
- Severity: REVIEW
- Reason: Field looks required (ID field likely required) but required=false.

**Explanation:**

The path remap `document.diaChi` → `person.idNumber` removed 2 FAIL issues and unmasked 1 REVIEW issue. The audit rule flags `person.idNumber` (ID field) with `required=false` as `REQUIRED_SUSPICIOUS`. This is a pre-existing metadata issue that was UNMASKED, not caused, by the mutation. The mutation is correct.

## REVIEW Attribution

**Net delta:** 1
**BM-096 mutation caused?** YES

**New REVIEW issues:**
- BM-096 `person.idNumber` (REQUIRED_SUSPICIOUS): Field looks required (ID field likely required) but required=false.

**Resolved REVIEW issues:**

## Safety Assertion Correction

| Field | Value |
|---|---|
| noMetricRegression | false |
| Caveat | REQUIRED_SUSPICIOUS increased by +1 (115->116) due to BM-096 mutation unmasking a pre-existing metadata issue on person.idNumber (required=false). This is a newly surfaced REVIEW issue, not a regression in the mutation itself. |
| isMutationFault | false |
| isUnmasking | true |
| followUpNeeded | true |
| followUpAction | Human review: confirm whether person.idNumber requires required=true in BM-096 |

## Conclusion

| | |
|---|---|
| Mutation accepted | YES |
| Rollback needed | NO |
| Next batch allowed | YES |

**Follow-up items:**
- [LOW] HUMAN_REVIEW: BM-096 `person.idNumber` — Is person.idNumber required in BM-096 based on DOCX/legal evidence? If yes, set required=true in a follow-up mutation.