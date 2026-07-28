# QLLAW Curated 37 — Visual / PDF Fidelity Summary

> **Generated**: 2026-07-08T14:25:58.812Z
> **STATUS**: PARTIAL
> **FIDELITY_COMPLETE_EVIDENCED**: false

## Counts

| Metric | Value |
|---|---|
| Total curated | 37 |
| Both PDFs converted | 37 |
| Page count match | 32 |
| Text sanity pass | 0 |
| Automated PASS (needs human confirm) | 0 |
| Human reviewed PASS | 0 |
| Human reviewed FAIL | 0 |
| fidelityComplete=true | 0 |
| Manual review required | 37 |

## Per-form results

| Code | Source PDF | Gen PDF | Pages | Page match | Text sanity | Max diff | Auto status | Human review | Complete |
|---|---|---|---|---|---|---|---|---|---|---|
| BM-001 | ✓ | ✓ | 2/2 | exact_match | fail | 0.067 | FAIL | NOT_REVIEWED | no |
| BM-005 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-006 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-007 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-008 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-009 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-010 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-011 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-012 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-014 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-015 | ✓ | ✓ | 2/3 | mismatch | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-017 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-018 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-019 | ✓ | ✓ | 2/1 | mismatch | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-020 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-022 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-023 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-030 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-031 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-033 | ✓ | ✓ | 1/2 | mismatch | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-035 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-036 | ✓ | ✓ | 2/2 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-037 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-038 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-040 | ✓ | ✓ | 1/2 | mismatch | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-042 | ✓ | ✓ | 1/2 | mismatch | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-043 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-044 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-045 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-046 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-047 | ✓ | ✓ | 2/2 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-048 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-052 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-053 | ✓ | ✓ | 2/2 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-054 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-070 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-171 | ✓ | ✓ | 2/2 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |

## Status rationale

All 37 forms converted to PDF. Automated checks pass for 0 forms. 37 forms still require human review. No fidelityComplete=true claims without human review.

## Remaining risks

- fidelityComplete=true only set for forms with explicit human review PASS.
- PIL pixel diff is automated and may miss subtle layout issues.
- Only first 5 pages per form are compared via image diff.
- FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.
