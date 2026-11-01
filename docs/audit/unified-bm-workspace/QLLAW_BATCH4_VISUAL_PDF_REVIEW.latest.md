# QLLAW Batch 4 — Visual / PDF Fidelity Summary

> **Generated**: 2026-07-10T02:56:51.908Z
> **STATUS**: PARTIAL
> **STATUS_NOTE**: All 20 forms converted to PDF. Automated checks pass for 0/20. 20 forms still require human review. No fidelityComplete=true claims without human review. Tooling note: pdfplumber CJK font extraction is unreliable — DOCX XML text sanity was already validated by QLLAW_BATCH4_GOLDEN_LAYOUT_FIDELITY.latest.json.
> **FIDELITY_COMPLETE_EVIDENCED**: false
> **MANUAL_REVIEW_REQUIRED**: 20

## Counts

| Metric | Value |
|---|---|
| Total Batch 4 forms | 20 |
| Both PDFs converted | 20 |
| Page count match | 20 |
| Text sanity pass | 0 |
| Automated PASS (needs human confirm) | 0 |
| Human reviewed PASS | 0 |
| Human reviewed FAIL | 0 |
| fidelityComplete=true | 0 |
| Manual review required | 20 |

## Per-form results

| Code | Source PDF | Gen PDF | Pages | Page match | Text sanity | Max diff | Auto status | Human review | Complete |
|---|---|---|---|---|---|---|---|---|---|---|
| BM-076 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-078 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-080 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-081 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-083 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-084 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-085 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-086 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-087 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-088 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-090 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-091 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-092 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-093 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-094 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-095 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-096 | ✓ | ✓ | 2/2 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-097 | ✓ | ✓ | 2/2 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-098 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |
| BM-100 | ✓ | ✓ | 1/1 | exact_match | fail | N/A | FAIL | NOT_REVIEWED | no |

## Status rationale

All 20 forms converted to PDF. Automated checks pass for 0/20. 20 forms still require human review. No fidelityComplete=true claims without human review. Tooling note: pdfplumber CJK font extraction is unreliable — DOCX XML text sanity was already validated by QLLAW_BATCH4_GOLDEN_LAYOUT_FIDELITY.latest.json.

## Remaining risks

- fidelityComplete=true only set for forms with explicit human review PASS.
- PIL pixel diff is automated and may miss subtle layout issues.
- Only first 5 pages per form are compared via image diff.
- pdfplumber text extraction is unreliable for Vietnamese CJK fonts — DOCX XML text sanity was validated by QLLAW_BATCH4_GOLDEN_LAYOUT_FIDELITY.latest.json.
- FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.
