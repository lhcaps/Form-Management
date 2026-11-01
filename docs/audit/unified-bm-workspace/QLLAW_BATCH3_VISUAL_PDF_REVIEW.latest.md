# QLLAW Batch 3 — Visual / PDF Fidelity Summary

> **Generated**: 2026-07-10T02:55:55.143Z
> **STATUS**: PARTIAL
> **STATUS_NOTE**: All 20 forms converted to PDF. Automated checks pass for 0/20. 20 forms still require human review. No fidelityComplete=true claims without human review. Tooling note: pdfplumber CJK font extraction is unreliable — DOCX XML text sanity was already validated by QLLAW_BATCH3_GOLDEN_LAYOUT_FIDELITY.latest.json.
> **FIDELITY_COMPLETE_EVIDENCED**: false
> **MANUAL_REVIEW_REQUIRED**: 20

## Counts

| Metric | Value |
|---|---|
| Total Batch 3 forms | 20 |
| Both PDFs converted | 20 |
| Page count match | 18 |
| Text sanity pass | 0 |
| Automated PASS (needs human confirm) | 0 |
| Human reviewed PASS | 0 |
| Human reviewed FAIL | 0 |
| fidelityComplete=true | 0 |
| Manual review required | 20 |

## Per-form results

| Code | Source PDF | Gen PDF | Pages | Page match | Text sanity | Max diff | Auto status | Human review | Complete |
|---|---|---|---|---|---|---|---|---|---|---|
| BM-055 | ✓ | ✓ | 2/2 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-056 | ✓ | ✓ | 2/2 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-057 | ✓ | ✓ | 1/2 | mismatch | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-058 | ✓ | ✓ | 2/2 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-059 | ✓ | ✓ | 3/3 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-060 | ✓ | ✓ | 2/2 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-061 | ✓ | ✓ | 2/2 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-062 | ✓ | ✓ | 2/3 | mismatch | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-063 | ✓ | ✓ | 2/2 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-064 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-065 | ✓ | ✓ | 2/2 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-066 | ✓ | ✓ | 3/3 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-067 | ✓ | ✓ | 2/2 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-068 | ✓ | ✓ | 2/2 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-069 | ✓ | ✓ | 2/2 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-071 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-072 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-073 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-074 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-075 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |

## Status rationale

All 20 forms converted to PDF. Automated checks pass for 0/20. 20 forms still require human review. No fidelityComplete=true claims without human review. Tooling note: pdfplumber CJK font extraction is unreliable — DOCX XML text sanity was already validated by QLLAW_BATCH3_GOLDEN_LAYOUT_FIDELITY.latest.json.

## Remaining risks

- fidelityComplete=true only set for forms with explicit human review PASS.
- PIL pixel diff is automated and may miss subtle layout issues.
- Only first 5 pages per form are compared via image diff.
- pdfplumber text extraction is unreliable for Vietnamese CJK fonts — DOCX XML text sanity was validated by QLLAW_BATCH3_GOLDEN_LAYOUT_FIDELITY.latest.json.
- FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.
