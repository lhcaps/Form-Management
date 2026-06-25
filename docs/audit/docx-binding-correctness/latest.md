# DOCX Binding Correctness — F4 audit
Generated: 2026-06-25T10:02:30.500Z

| Metric | Value |
|--------|-------|
| totalContracts | 213 |
| passCount | 212 |
| reviewRequiredCount | 1 |
| failCount | 0 |
| noRequiredManualFields | 0 |

## REVIEW_REQUIRED

| templateCode | type | reason |
|--------------|------|--------|
| BM-021 | smoke | 1 non-required placeholder(s) left unreplaced: {{agency.nameUpper}}. These fields are not required/editable/manual and the mock did not fill them. |

## Representative BMs

| templateCode | status | reqFields | found | missing | xmlContext |
|--------------|--------|-----------|-------|---------|------------|
| BM-001 | PASS | 24 | 24 | 0 | PASS |
| BM-051 | PASS | 0 | 0 | 0 | PASS |
| BM-053 | PASS | 20 | 20 | 0 | PASS |
| BM-100 | PASS | 0 | 0 | 0 | PASS |
| BM-150 | PASS | 16 | 16 | 0 | PASS |
| BM-200 | PASS | 0 | 0 | 0 | PASS |

## Corpus smoke summary

| status | count |
|--------|-------|
| PASS | 206 |
| REVIEW_REQUIRED | 1 |

