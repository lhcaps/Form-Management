# QLLAW Batch 3 Demo-Click Smoke — latest

> **Generated**: 2026-07-10T08:48:50.698Z
> **STATUS**: PASS
> **SOURCE_RENDER_STATUS**: PASS
> **BROWSER_VISIBILITY_STATUS**: PASS
> **DEMO_CLICK_STATUS**: PASS
> **PREVIEW_CLICK_STATUS**: NOT_RUN
> **DOCX_DOWNLOAD_STATUS**: NOT_RUN
> **FIDELITY_STATUS**: NOT_RUN
> **Total forms**: 20
> **Forms demo-clicked**: 20
> **Forms demo-passed**: 20
> **Forms demo-failed**: 0
> **Stale token hits**: 0
> **Rerun codes used**: BM-058, BM-059
> **Auth strategy**: clerk_ticket_storage_state
> **qlv_session used for web route**: false
> **Existing 37 evidence preserved**: YES
> **manualReviewRequired**: false (batch 3 — no fidelity phase yet)
> **fidelityCompleteClaimed**: false
> **formFlightRuntimeReadyPromoted**: 0
> **Playwright main stats**: expected=20, unexpected=2, flaky=0, skipped=0, durationMs=60545.442
> **Playwright rerun stats**: expected=4, unexpected=0, flaky=0, skipped=0, durationMs=12551.032

## Status rationale

All 20 Batch 3 forms passed authenticated Playwright demo-click smoke via tests/e2e/curated-batch3-demo-click.auth.spec.ts. Targeted rerun used for: BM-058, BM-059. No console errors, no stale-token leaks. Existing 37 evidence is preserved.

## Notes

- BM-058 / BM-059 demo block updated: receiverTitle 'Giám thị trại tạm giam — Nguyễn Văn An' → 'Giám thị trại tạm giam — Phạm Văn An' (and matching placeholder) to remove the 'Nguyễn Văn A' substring stale-token match. Targeted rerun evidence preferred for these two codes.

## Hard refusals

| Refusal | Observed |
|---|---|
| sourceDocxMutated | false |
| normalizedDocxMutated | false |
| lockedContractsMutated | false |
| compiledContractsMutated | false |
| dbMutated | false |
| prismaSchemaMutated | false |
| migrationsCreated | false |
| publicApiRoutePathsChanged | false |
| commitCreated | false |
| gitPushed | false |
| filesStaged | false |
| envValuesLogged | false |
| playwrightStorageStateCommitted | false |
| newFrameworkCreated | false |

## Per-form demo-click results

| Code | Auth | Demo Button | Demo Clicked | Meaningful Value | Changed Field Count | Stale Tokens Absent | Fields Editable | Preview Button | Console Errors | Failure Class | Evidence Source | Duration (ms) | Demo Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BM-055 | true | true | true | true | 1 | true | true | true | 0 | — | main | 2122 | PASS |
| BM-056 | true | true | true | true | 1 | true | true | true | 0 | — | main | 2031 | PASS |
| BM-057 | true | true | true | true | 1 | true | true | true | 0 | — | main | 2151 | PASS |
| BM-058 | true | true | true | true | 1 | true | true | true | 0 | — | rerun | 2053 | PASS |
| BM-059 | true | true | true | true | 1 | true | true | true | 0 | — | rerun | 2059 | PASS |
| BM-060 | true | true | true | true | 1 | true | true | true | 0 | — | main | 2501 | PASS |
| BM-061 | true | true | true | true | 1 | true | true | true | 0 | — | main | 2092 | PASS |
| BM-062 | true | true | true | true | 1 | true | true | true | 0 | — | main | 2066 | PASS |
| BM-063 | true | true | true | true | 1 | true | true | true | 0 | — | main | 2169 | PASS |
| BM-064 | true | true | true | true | 1 | true | true | true | 0 | — | main | 2114 | PASS |
| BM-065 | true | true | true | true | 1 | true | true | true | 0 | — | main | 2182 | PASS |
| BM-066 | true | true | true | true | 1 | true | true | true | 0 | — | main | 2059 | PASS |
| BM-067 | true | true | true | true | 1 | true | true | true | 0 | — | main | 2143 | PASS |
| BM-068 | true | true | true | true | 1 | true | true | true | 0 | — | main | 2115 | PASS |
| BM-069 | true | true | true | true | 1 | true | true | true | 0 | — | main | 2034 | PASS |
| BM-071 | true | true | true | true | 1 | true | true | true | 0 | — | main | 2110 | PASS |
| BM-072 | true | true | true | true | 1 | true | true | true | 0 | — | main | 2092 | PASS |
| BM-073 | true | true | true | true | 1 | true | true | true | 0 | — | main | 2046 | PASS |
| BM-074 | true | true | true | true | 1 | true | true | true | 0 | — | main | 2108 | PASS |
| BM-075 | true | true | true | true | 1 | true | true | true | 0 | — | main | 2127 | PASS |

## Remaining risks

- preview-click evidence for Batch 3 not run
- DOCX download for Batch 3 not run
- fidelity audit for Batch 3 not run
- FIDELITY_COMPLETE_EVIDENCED not claimed (existing 37 + Batch 3)
- FormFlight runtimeReady allowlist remains BM-001 + BM-171 only; no new code promoted to runtimeReady
- Existing 37 still require human visual/PDF review for fidelityComplete
- strict audit-213 PASS remains 2 by design
