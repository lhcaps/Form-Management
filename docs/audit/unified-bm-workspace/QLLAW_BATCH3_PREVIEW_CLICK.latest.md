# QLLAW Batch 3 Preview-Click Smoke — latest

> **Generated**: 2026-07-10T08:48:50.750Z
> **STATUS**: PASS
> **STATUS_NOTE**: All 20 Batch 3 forms passed authenticated Playwright preview-click smoke via tests/e2e/curated-batch3-preview-click.auth.spec.ts. POST preview-session returned application/json for every code with persisted=false, sessionId prefixed runtime_preview_, docxDownloadUrl present, no binary PK leak, no generatedDocumentId leak, no auto-download, no /documents route navigation, no 'Lịch sử xử lý' link, no console errors. Existing 37 evidence is preserved.
> **SOURCE_RENDER_STATUS**: PASS
> **BROWSER_VISIBILITY_STATUS**: PASS
> **DEMO_CLICK_STATUS**: PASS
> **PREVIEW_CLICK_STATUS**: PASS
> **DOCX_DOWNLOAD_STATUS**: NOT_RUN
> **FIDELITY_STATUS**: NOT_RUN
> **Total forms**: 20
> **Forms preview-clicked**: 20
> **Forms preview-passed**: 20
> **Forms preview-failed**: 0
> **Binary PK leaks**: 0
> **Generated document leaks**: 0
> **Auto-download leaks**: 0
> **History link leaks**: 0
> **Documents route leaks**: 0
> **Auth strategy**: clerk_ticket_storage_state
> **qlv_session used for web route**: false
> **Existing 37 evidence preserved**: YES
> **manualReviewRequired**: false (batch 3 — no fidelity phase yet)
> **fidelityCompleteClaimed**: false
> **formFlightRuntimeReadyPromoted**: 0
> **Playwright stats**: expected=22, unexpected=0, flaky=0, skipped=0, durationMs=160483.759

## Status rationale

All 20 Batch 3 forms passed authenticated Playwright preview-click smoke via tests/e2e/curated-batch3-preview-click.auth.spec.ts. POST preview-session returned application/json for every code with persisted=false, sessionId prefixed runtime_preview_, docxDownloadUrl present, no binary PK leak, no generatedDocumentId leak, no auto-download, no /documents route navigation, no 'Lịch sử xử lý' link, no console errors. Existing 37 evidence is preserved.

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

## Per-form preview-click results

| Code | Auth | Demo Clicked | Preview Button | Preview Clicked | POST Observed | Status Code | JSON | Binary PK | Persisted False | SessionId Prefix | DOCX URL | PDF URL | Fallback Honest | No Auto Download | No History Link | No GenDocId | No /documents Route | Console Errors | Failure Class | Preview Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BM-055 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-056 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-057 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-058 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-059 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-060 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-061 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-062 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-063 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-064 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-065 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-066 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-067 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-068 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-069 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-071 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-072 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-073 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-074 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-075 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |

## Failure classification table (preserved for future runs)

- PREVIEW_BUTTON_MISSING — 'Xem trước bản in' not visible
- PREVIEW_REQUEST_NOT_FIRED — POST preview-session never sent
- PREVIEW_REQUEST_TIMEOUT — POST preview-session > 30s
- PREVIEW_RESPONSE_4XX_OR_5XX — response status outside 2xx
- PREVIEW_RESPONSE_BINARY_PK — response body starts with 'PK'
- PREVIEW_JSON_INVALID — response is JSON but does not parse
- PERSISTED_TRUE — persisted === true (workspace leak)
- GENERATED_DOCUMENT_ID_LEAK — generatedDocumentId appears in JSON
- AUTO_DOWNLOAD_WRONG — browser download fired on preview click
- DOCX_URL_MISSING — docxDownloadUrl missing or wrong shape
- FALLBACK_COPY_WRONG — pdfPreviewUrl===null but no amber fallback
- HISTORY_LINK_LEAK — 'Lịch sử xử lý' rendered in standalone
- DOCUMENTS_ROUTE_LEAK — page navigated to /documents/...
- AUTH_FAIL — bounced to /sign-in or /sign-up
- ROUTE_RENDER_FAIL — title/sections/inputs missing
- CONSOLE_ERRORS — unhandled exception / pageerror
- UNKNOWN — any other failure

## Remaining risks

- DOCX download for Batch 3 not run
- fidelity audit for Batch 3 not run
- FIDELITY_COMPLETE_EVIDENCED not claimed (existing 37 + Batch 3)
- FormFlight runtimeReady allowlist remains BM-001 + BM-171 only; no new code promoted to runtimeReady
- Existing 37 still require human visual/PDF review for fidelityComplete
- strict audit-213 PASS remains 2 by design
