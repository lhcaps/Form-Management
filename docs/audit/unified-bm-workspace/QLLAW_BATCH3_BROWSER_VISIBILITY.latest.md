# QLLAW Batch 3 Browser Visibility Smoke — latest

> **Generated**: 2026-07-10T08:48:50.642Z
> **STATUS**: PASS
> **SOURCE_RENDER_STATUS**: PASS
> **BROWSER_VISIBILITY_STATUS**: PASS
> **Total forms**: 20
> **Forms visibility smoked**: 20
> **Forms visibility passed**: 20
> **Forms visibility failed**: 0
> **Auth strategy**: clerk_ticket_storage_state
> **qlv_session used for web route**: false
> **Existing 37 evidence preserved**: YES
> **manualReviewRequired**: false (batch 3 — no fidelity phase yet)
> **fidelityCompleteClaimed**: false
> **formFlightRuntimeReadyPromoted**: 0
> **Playwright stats**: expected=22, unexpected=0, flaky=0, skipped=0, durationMs=38284.457

## Status rationale

All 20 Batch 3 forms passed authenticated Playwright visibility smoke via tests/e2e/curated-batch3-templates.auth.spec.ts. No throttling, no flaky, no console errors. Existing 37 evidence is preserved.

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

## Per-form visibility results

| Code | Authenticated | Route 200 | Not 404 | SignIn Redirect | Title/Code | Section | Field | Preview Button | Console Errors | Failure Class | Browser Status | Duration (ms) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BM-055 | true | true | true | false | true | true | true | true | — | — | PASS | 1618 |
| BM-056 | true | true | true | false | true | true | true | true | — | — | PASS | 1433 |
| BM-057 | true | true | true | false | true | true | true | true | — | — | PASS | 1375 |
| BM-058 | true | true | true | false | true | true | true | true | — | — | PASS | 1382 |
| BM-059 | true | true | true | false | true | true | true | true | — | — | PASS | 1385 |
| BM-060 | true | true | true | false | true | true | true | true | — | — | PASS | 1510 |
| BM-061 | true | true | true | false | true | true | true | true | — | — | PASS | 1503 |
| BM-062 | true | true | true | false | true | true | true | true | — | — | PASS | 1540 |
| BM-063 | true | true | true | false | true | true | true | true | — | — | PASS | 1454 |
| BM-064 | true | true | true | false | true | true | true | true | — | — | PASS | 1524 |
| BM-065 | true | true | true | false | true | true | true | true | — | — | PASS | 1507 |
| BM-066 | true | true | true | false | true | true | true | true | — | — | PASS | 1451 |
| BM-067 | true | true | true | false | true | true | true | true | — | — | PASS | 1546 |
| BM-068 | true | true | true | false | true | true | true | true | — | — | PASS | 1536 |
| BM-069 | true | true | true | false | true | true | true | true | — | — | PASS | 1458 |
| BM-071 | true | true | true | false | true | true | true | true | — | — | PASS | 1520 |
| BM-072 | true | true | true | false | true | true | true | true | — | — | PASS | 1507 |
| BM-073 | true | true | true | false | true | true | true | true | — | — | PASS | 1517 |
| BM-074 | true | true | true | false | true | true | true | true | — | — | PASS | 1493 |
| BM-075 | true | true | true | false | true | true | true | true | — | — | PASS | 1561 |

## Notes

- This is a browser-visibility PASS only; it asserts that the runtime-ux shell is visible and reachable, NOT that demo-click, preview-click, or DOCX download work.
- demoClickVerified, previewClickVerified, docxDownloadVerified, and fidelityAuditStatus remain false/null for all 20 Batch 3 forms. No demo-click / preview-click / DOCX download / fidelity audit was run in this phase.
- Existing 37 curated forms retain all prior evidence (browser/demo/preview/docx/fidelity/visualpdf) and are not affected by this artifact.
- FormFlight runtimeReady allowlist remains BM-001 + BM-171 only; no new code was promoted to runtimeReady.
- FIDELITY_COMPLETE_EVIDENCED is not claimed by this artifact.
