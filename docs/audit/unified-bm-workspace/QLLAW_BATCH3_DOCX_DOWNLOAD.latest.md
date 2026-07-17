# QLLAW Batch 3 DOCX Download Smoke — latest

> **Generated**: 2026-07-10T08:48:50.807Z
> **STATUS**: PASS
> **STATUS_NOTE**: All 20 Batch 3 forms passed authenticated DOCX download smoke via tests/e2e/curated-batch3-docx-download.auth.spec.ts. Each form: POST preview-session returned application/json (persisted=false, sessionId prefixed runtime_preview_, docxDownloadUrl present); explicit authenticated GET against the captured docxDownloadUrl returned 200 with content-type application/vnd.openxmlformats-officedocument.wordprocessingml.document; downloaded buffer started with PK (20/20 independently re-confirmed by parse-batch3-docx-download.mjs on .tmp-batch3-docx-download-smoke/<code>.docx); PizZip opens the package as a valid DOCX ZIP for every form; [Content_Types].xml + _rels/.rels + word/document.xml present in every package; no placeholder leaks {{ / }} / undefined / null / [object Object]; no stale demo tokens Nguyễn Văn A / Trần Thị B / Ông cung cấp / Nguyễn Thị Hồng Hạnh leaked; no generatedDocumentId in preview-session JSON; no /documents/:id navigation; no 'Lịch sử xử lý' link in standalone; no console errors. Existing 37 evidence is preserved. No DB rows, no schema migration, no source/normalized/locked/compiled contract mutation, no auth-state or env-value committed. FIDELITY_COMPLETE_EVIDENCED not claimed: this artifact proves the runtime preview-session DOCX download lifecycle works structurally for the Batch 3 forms — NOT golden layout equivalence (visual / content fidelity remains out of scope for this phase).
> **SOURCE_RENDER_STATUS**: PASS
> **BROWSER_VISIBILITY_STATUS**: PASS
> **DEMO_CLICK_STATUS**: PASS
> **PREVIEW_CLICK_STATUS**: PASS
> **DOCX_DOWNLOAD_STATUS**: PASS
> **FIDELITY_STATUS**: NOT_RUN
> **Total forms**: 20
> **Forms DOCX-downloaded**: 20
> **Forms DOCX-passed**: 20
> **Forms DOCX-failed**: 0
> **Binary PK passes**: 20
> **ZIP open passes**: 20
> **Content Types present**: 20
> **word/document.xml present**: 20
> **Placeholder leaks**: 0
> **Stale token leaks**: 0
> **Generated document leaks**: 0
> **History link leaks**: 0
> **Documents route leaks**: 0
> **Auth strategy**: clerk_ticket_storage_state
> **qlv_session used for web route**: false
> **Existing 37 evidence preserved**: YES
> **manualReviewRequired**: false (batch 3 — no fidelity phase yet)
> **fidelityCompleteClaimed**: false
> **formFlightRuntimeReadyPromoted**: 0
> **Playwright stats**: expected=22, unexpected=0, flaky=0, skipped=0, durationMs=158171.067

## Status rationale

All 20 Batch 3 forms passed authenticated DOCX download smoke via tests/e2e/curated-batch3-docx-download.auth.spec.ts. Each form: POST preview-session returned application/json (persisted=false, sessionId prefixed runtime_preview_, docxDownloadUrl present); explicit authenticated GET against the captured docxDownloadUrl returned 200 with content-type application/vnd.openxmlformats-officedocument.wordprocessingml.document; downloaded buffer started with PK (20/20 independently re-confirmed by parse-batch3-docx-download.mjs on .tmp-batch3-docx-download-smoke/<code>.docx); PizZip opens the package as a valid DOCX ZIP for every form; [Content_Types].xml + _rels/.rels + word/document.xml present in every package; no placeholder leaks {{ / }} / undefined / null / [object Object]; no stale demo tokens Nguyễn Văn A / Trần Thị B / Ông cung cấp / Nguyễn Thị Hồng Hạnh leaked; no generatedDocumentId in preview-session JSON; no /documents/:id navigation; no 'Lịch sử xử lý' link in standalone; no console errors. Existing 37 evidence is preserved. No DB rows, no schema migration, no source/normalized/locked/compiled contract mutation, no auth-state or env-value committed. FIDELITY_COMPLETE_EVIDENCED not claimed: this artifact proves the runtime preview-session DOCX download lifecycle works structurally for the Batch 3 forms — NOT golden layout equivalence (visual / content fidelity remains out of scope for this phase).

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

## Per-form DOCX download results

| Code | Auth | Demo Clicked | Preview Session | Persisted False | SessionId Prefix | DOCX URL | Download Status | Byte Length | Starts PK | ZIP Open | Content Types | document.xml | Placeholder | Stale | No GenDoc | No History | No /documents | Failure Class | DOCX Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BM-055 | true | true | 200 | true | true | true | 200 | 116298 | true | true | true | true | no | no | yes | yes | yes | — | PASS |
| BM-056 | true | true | 200 | true | true | true | 200 | 159286 | true | true | true | true | no | no | yes | yes | yes | — | PASS |
| BM-057 | true | true | 200 | true | true | true | 200 | 150247 | true | true | true | true | no | no | yes | yes | yes | — | PASS |
| BM-058 | true | true | 200 | true | true | true | 200 | 145162 | true | true | true | true | no | no | yes | yes | yes | — | PASS |
| BM-059 | true | true | 200 | true | true | true | 200 | 130744 | true | true | true | true | no | no | yes | yes | yes | — | PASS |
| BM-060 | true | true | 200 | true | true | true | 200 | 73850 | true | true | true | true | no | no | yes | yes | yes | — | PASS |
| BM-061 | true | true | 200 | true | true | true | 200 | 76445 | true | true | true | true | no | no | yes | yes | yes | — | PASS |
| BM-062 | true | true | 200 | true | true | true | 200 | 94131 | true | true | true | true | no | no | yes | yes | yes | — | PASS |
| BM-063 | true | true | 200 | true | true | true | 200 | 85909 | true | true | true | true | no | no | yes | yes | yes | — | PASS |
| BM-064 | true | true | 200 | true | true | true | 200 | 64691 | true | true | true | true | no | no | yes | yes | yes | — | PASS |
| BM-065 | true | true | 200 | true | true | true | 200 | 84579 | true | true | true | true | no | no | yes | yes | yes | — | PASS |
| BM-066 | true | true | 200 | true | true | true | 200 | 101053 | true | true | true | true | no | no | yes | yes | yes | — | PASS |
| BM-067 | true | true | 200 | true | true | true | 200 | 75910 | true | true | true | true | no | no | yes | yes | yes | — | PASS |
| BM-068 | true | true | 200 | true | true | true | 200 | 85572 | true | true | true | true | no | no | yes | yes | yes | — | PASS |
| BM-069 | true | true | 200 | true | true | true | 200 | 84299 | true | true | true | true | no | no | yes | yes | yes | — | PASS |
| BM-071 | true | true | 200 | true | true | true | 200 | 110432 | true | true | true | true | no | no | yes | yes | yes | — | PASS |
| BM-072 | true | true | 200 | true | true | true | 200 | 100030 | true | true | true | true | no | no | yes | yes | yes | — | PASS |
| BM-073 | true | true | 200 | true | true | true | 200 | 66661 | true | true | true | true | no | no | yes | yes | yes | — | PASS |
| BM-074 | true | true | 200 | true | true | true | 200 | 96152 | true | true | true | true | no | no | yes | yes | yes | — | PASS |
| BM-075 | true | true | 200 | true | true | true | 200 | 94115 | true | true | true | true | no | no | yes | yes | yes | — | PASS |

## Failure classification table (preserved for future runs)

- DOCX_URL_MISSING — docxDownloadUrl missing or wrong shape
- DOCX_DOWNLOAD_4XX / DOCX_DOWNLOAD_5XX — download status 4xx/5xx
- DOCX_DOWNLOAD_NOT_BINARY — content-type JSON/HTML instead of DOCX
- DOCX_DOWNLOAD_TOO_SMALL — buffer <= 5KB
- DOCX_NOT_ZIP — first two bytes are not 'PK'
- DOCX_MISSING_CONTENT_TYPES — [Content_Types].xml missing
- DOCX_MISSING_DOCUMENT_XML — word/document.xml missing
- DOCX_PLACEHOLDER_LEAK — {{ }} undefined [object Object] in document.xml
- DOCX_STALE_TOKEN_LEAK — Nguyễn Văn A / Trần Thị B / Ông cung cấp / Nguyễn Thị Hồng Hạnh leaked
- GENERATED_DOCUMENT_ID_LEAK — generatedDocumentId in JSON
- HISTORY_LINK_LEAK — 'Lịch sử xử lý' rendered in standalone
- DOCUMENTS_ROUTE_LEAK — page navigated to /documents/...
- AUTH_FAIL — bounced to /sign-in or /sign-up
- ROUTE_RENDER_FAIL — title/sections/inputs missing
- PREVIEW_PERSISTED_LEAK — preview-session persisted=true
- SESSION_ID_PREFIX_INVALID — sessionId not runtime_preview_
- PREVIEW_SESSION_FAIL — preview-session POST did not 2xx
- THROTTLED_TRANSIENT — request timed out (rerun target)
- CONSOLE_ERRORS — pageerror / unhandled exception
- UNKNOWN — any other failure

## Remaining risks

- Batch 3 machine-checkable fidelity not run
- Batch 3 visual/PDF review not run
- Existing 37 still require human visual/PDF review for fidelityComplete
- FormFlight runtimeReady allowlist remains BM-001 + BM-171 only (not promoted)
- strict audit-213 PASS remains 2 by design
- FIDELITY_COMPLETE_EVIDENCED not claimed — this proves structural DOCX-package validity only
