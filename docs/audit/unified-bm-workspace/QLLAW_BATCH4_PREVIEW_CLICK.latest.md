# QLLAW Batch 4 Preview-Click Smoke — latest

> **Generated**: 2026-07-10T08:48:51.115Z
> **STATUS**: PASS
> **STATUS_NOTE**: All 20 Batch 4 forms passed authenticated Playwright preview-click smoke via tests/e2e/curated-batch4-preview-click.auth.spec.ts. POST preview-session returned application/json for every code with persisted=false, sessionId prefixed runtime_preview_, docxDownloadUrl present, no binary PK leak, no generatedDocumentId leak, no auto-download, no /documents route navigation, no 'Lịch sử xử lý' link, no console errors. Existing 57 evidence (37 curated + 20 batch 3) remains untouched.
> **SOURCE_RENDER_STATUS**: PASS
> **BROWSER_VISIBILITY_STATUS**: PASS
> **DEMO_CLICK_STATUS**: PASS
> **PREVIEW_CLICK_STATUS**: PASS
> **DOCX_DOWNLOAD_STATUS**: NOT_RUN for Batch 4
> **MACHINE_CHECKABLE_FIDELITY_STATUS**: NOT_RUN for Batch 4
> **VISUAL_PDF_FIDELITY_STATUS**: NOT_RUN for Batch 4
> **FIDELITY_COMPLETE_CLAIMED**: false
> **Total forms**: 20
> **Forms preview-clicked**: 20
> **Forms preview-passed**: 20
> **Forms preview-failed**: 0
> **Binary PK leaks**: 0
> **Content-Disposition leaks**: 0
> **Generated document leaks**: 0
> **Auto-download leaks**: 0
> **History link leaks**: 0
> **/documents/ route leaks**: 0
> **DOCX download leaks**: 0
> **Untruthful preview UI count**: 0
> **Rerun overrides**: (none)
> **Auth strategy**: clerk_ticket_storage_state
> **qlv_session used for web route**: false
> **Existing 57 evidence preserved**: YES
> **FormFlight runtimeReady promoted**: 0
> **Playwright main stats**: expected=22, unexpected=0, flaky=0, skipped=0, durationMs=169199.21999999997
> **Playwright rerun stats**: not run

## Status rationale

All 20 Batch 4 forms passed authenticated Playwright preview-click smoke via tests/e2e/curated-batch4-preview-click.auth.spec.ts. POST preview-session returned application/json for every code with persisted=false, sessionId prefixed runtime_preview_, docxDownloadUrl present, no binary PK leak, no generatedDocumentId leak, no auto-download, no /documents route navigation, no 'Lịch sử xử lý' link, no console errors. Existing 57 evidence (37 curated + 20 batch 3) remains untouched.

## Notes

- Batch 4 preview-click smoke ran via tests/e2e/curated-batch4-preview-click.auth.spec.ts.
- Spec asserts authenticated URL is not sign-in/sign-up, BM code or title visible, at least one h3 section heading visible, at least one input/textarea/select visible, 'Dữ liệu demo' clicked first to satisfy locked-contract requiredFieldKeys gate, 'Xem trước bản in' button visible/enabled, POST preview-session observed, response is application/json, parsed body is JSON (no PK leak), persisted=false, sessionId prefixed runtime_preview_, docxDownloadUrl present, no generatedDocumentId leak, no auto-download, no /documents route navigation, no 'Lịch sử xử lý' link, no console errors.
- Spec does NOT click 'Tải DOCX', does NOT download DOCX, does NOT run fidelity, does NOT curate more forms.
- Existing 37 + Batch 3 (57 total) evidence remains untouched and valid.
- Batch 4 source-render + browser-visibility + demo-click evidence remains untouched and valid.
- No FIDELITY_COMPLETE_EVIDENCED claim is set.
- FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.
- DOCX download / machine-checkable fidelity / visual-PDF review phases for Batch 4 run in separate follow-up phases.

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

## Per-form batch 4 preview-click results

| Code | Auth | Demo Clicked | Preview Button | Preview Clicked | POST Observed | Status Code | JSON | Binary PK | Persisted False | SessionId Prefix | DOCX URL | PDF URL | Fallback Honest | No Auto Download | No History Link | No GenDocId | No /documents Route | Console Errors | Failure Class | Preview Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BM-076 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-078 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-080 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-081 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-083 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-084 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-085 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-086 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-087 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-088 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-090 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-091 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-092 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-093 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-094 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-095 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-096 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-097 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-098 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |
| BM-100 | true | true | true | true | true | 200 | true | false | true | true | true | no | true | true | true | true | true | 0 | — | PASS |

## Remaining risks

- Batch 4 DOCX download not run
- Batch 4 machine-checkable fidelity not run
- Batch 4 visual/PDF review not run
- Existing 37 + Batch 3 still require visual/PDF review before fidelityComplete
- Batch 4 will require DOCX download, machine-checkable fidelity, then visual/PDF/human review before fidelityComplete
- FormFlight runtimeReady allowlist remains BM-001 + BM-171 only
- FIDELITY_COMPLETE_EVIDENCED not claimed
- strict audit-213 PASS remains 2 by design
