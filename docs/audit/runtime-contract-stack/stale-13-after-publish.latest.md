# Stale 13 Contracts — Post-Publish Report

**Task:** `PUBLISH_STALE_13_CONTRACTS_AND_VERIFY_RUNTIME_SYNC`
**Phase:** post-publish
**Generated:** 2026-06-28T03:46:00.000+07:00

## DB Sync Status (Post-Publish)

| Metric | Pre-Publish | Post-Publish | Delta |
|--------|-------------|--------------|-------|
| Matched | 200 | **213** | +13 |
| Missing | 0 | **0** | 0 |
| Stale | **13** | **0** | -13 |
| CI Gate | FAILED | **PASSED** | ✅ |

## Publish Result

```
OFFICIAL_ID=1 pnpm publish:forms:db
Contracts created: 16 (stale contracts + BM-068, BM-069)
Contracts skipped: 197 (already up-to-date)
Total: 213
```

## Contracts Published

| # | Template | Notes |
|---|----------|-------|
| 1 | BM-051 | Pre-existing stale |
| 2 | BM-052 | Pre-existing stale |
| 3 | BM-060 | Pre-existing stale |
| 4 | BM-061 | Pre-existing stale |
| 5 | BM-062 | Pre-existing stale |
| 6 | BM-063 | Pre-existing stale |
| 7 | BM-065 | Pre-existing stale |
| 8 | BM-066 | Pre-existing stale |
| 9 | BM-067 | Pre-existing stale |
| 10 | BM-075 | Pre-existing stale |
| 11 | BM-080 | Pre-existing stale |
| 12 | BM-096 | Fresh stale from mutation |
| 13 | BM-163 | Pre-existing stale |
| +2 | BM-068, BM-069 | Also inserted during publish |

## Runtime DB Sync Status

**CLEAN.** `matched=213, missing=0, stale=0`. Next corpus batch can proceed.
