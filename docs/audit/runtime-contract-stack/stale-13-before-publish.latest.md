# Stale 13 Contracts — Pre-Publish Report

**Task:** `PUBLISH_STALE_13_CONTRACTS_AND_VERIFY_RUNTIME_SYNC`
**Phase:** pre-publish
**Generated:** 2026-06-28T03:38:00.000+07:00

## DB Sync Status

| Metric | Value |
|--------|-------|
| Matched | 200 |
| Missing | 0 |
| Stale | **13** |
| CI Gate | FAILED |

## Stale Contracts

| # | Template | Likely Cause |
|---|----------|-------------|
| 1 | BM-051 | Pre-existing from prior batches |
| 2 | BM-052 | Pre-existing from prior batches |
| 3 | BM-060 | Pre-existing from prior batches |
| 4 | BM-061 | Pre-existing from prior batches |
| 5 | BM-062 | Pre-existing from prior batches |
| 6 | BM-063 | Pre-existing from prior batches |
| 7 | BM-065 | Pre-existing from prior batches |
| 8 | BM-066 | Pre-existing from prior batches |
| 9 | BM-067 | Pre-existing from prior batches |
| 10 | BM-075 | Pre-existing from prior batches |
| 11 | BM-080 | Pre-existing from prior batches |
| 12 | BM-096 | Fresh stale from current mutation |
| 13 | BM-163 | Pre-existing from prior batches |

## Stale Analysis

- **BM-096**: Fresh stale from the `document.diaChi → person.idNumber` remap applied on 2026-06-27. The locked contract was updated but the DB was not re-published.
- **12 others**: Pre-existing stale from prior batches (remediation-leak-batch-1b, batch-2a, Wave 02 DOCX review, path-domain-binding-layer-a/b/c approved). These accumulated during earlier apply batches that did not trigger a DB publish.

## Next Action

Publish: `OFFICIAL_ID=1 node scripts/docx-contract/publish-locked-contracts-to-db.mjs`
Expected post-publish: matched=213, missing=0, stale=0
