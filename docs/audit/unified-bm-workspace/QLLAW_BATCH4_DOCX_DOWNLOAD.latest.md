# QLLAW Batch 4 DOCX Download Smoke — latest

> **Generated**: 2026-07-10T08:48:51.169Z
> **STATUS**: PASS
> **STATUS_NOTE**: All 20 Batch 4 forms passed authenticated DOCX download smoke via tests/e2e/curated-batch4-docx-download.auth.spec.ts. Each form: POST preview-session returned application/json (persisted=false, sessionId prefixed runtime_preview_, docxDownloadUrl present, no Content-Disposition attachment header, no binary PK leak); explicit authenticated GET against the captured docxDownloadUrl returned 200 with content-type application/vnd.openxmlformats-officedocument.wordprocessingml.document; downloaded buffer started with PK (20/20 independently re-confirmed by parse-batch4-docx-download.mjs on .tmp-batch4-docx-download-smoke/<code>.docx); PizZip opens the package as a valid DOCX ZIP for every form; [Content_Types].xml + _rels/.rels + word/document.xml present in every package; no placeholder leaks {{ / }} / undefined / null / [object Object]; no stale demo tokens Nguyễn Văn A / Trần Thị B / Ông cung cấp / Nguyễn Thị Hồng Hạnh leaked; no generatedDocumentId in preview-session JSON; no /documents/:id navigation; no 'Lịch sử xử lý' link in standalone; no console errors. Existing 57 evidence (37 curated + 20 batch 3) is preserved. No DB rows, no schema migration, no source/normalized/locked/compiled contract mutation, no auth-state or env-value committed. FIDELITY_COMPLETE_EVIDENCED not claimed: this artifact proves the runtime preview-session DOCX download lifecycle works structurally for the Batch 4 forms — NOT golden layout equivalence (visual / content fidelity remains out of scope for this phase).
> **SOURCE_RENDER_STATUS**: PASS
> **BROWSER_VISIBILITY_STATUS**: PASS
> **DEMO_CLICK_STATUS**: PASS
> **PREVIEW_CLICK_STATUS**: PASS
> **DOCX_DOWNLOAD_STATUS**: PASS
> **MACHINE_CHECKABLE_FIDELITY_STATUS**: NOT_RUN for Batch 4
> **VISUAL_PDF_FIDELITY_STATUS**: NOT_RUN for Batch 4
> **FIDELITY_COMPLETE_CLAIMED**: false
> **Total forms**: 20
> **Forms DOCX-downloaded**: 20
> **Forms DOCX-passed**: 20
> **Forms DOCX-failed**: 0
> **Binary PK passes**: 20
> **ZIP open passes**: 20
> **Content Types present**: 20
> **_rels/.rels present**: 20
> **word/document.xml present**: 20
> **Placeholder leaks**: 0
> **Stale token leaks**: 0
> **Generated document leaks**: 0
> **History link leaks**: 0
> **Documents route leaks**: 0
> **Content-Disposition leaks (preview-session)**: 0
> **Auth strategy**: clerk_ticket_storage_state
> **qlv_session used for web route**: false
> **Existing 57 evidence preserved**: YES
> **manualReviewRequired**: false (batch 4 — no fidelity phase yet)
> **formFlightRuntimeReadyPromoted**: 0
> **Rerun overrides**: (none)
> **Playwright main stats**: expected=22, unexpected=0, flaky=0, skipped=0, durationMs=159140.279
> **Playwright rerun stats**: not run

## Status rationale

All 20 Batch 4 forms passed authenticated DOCX download smoke via tests/e2e/curated-batch4-docx-download.auth.spec.ts. Each form: POST preview-session returned application/json (persisted=false, sessionId prefixed runtime_preview_, docxDownloadUrl present, no Content-Disposition attachment header, no binary PK leak); explicit authenticated GET against the captured docxDownloadUrl returned 200 with content-type application/vnd.openxmlformats-officedocument.wordprocessingml.document; downloaded buffer started with PK (20/20 independently re-confirmed by parse-batch4-docx-download.mjs on .tmp-batch4-docx-download-smoke/<code>.docx); PizZip opens the package as a valid DOCX ZIP for every form; [Content_Types].xml + _rels/.rels + word/document.xml present in every package; no placeholder leaks {{ / }} / undefined / null / [object Object]; no stale demo tokens Nguyễn Văn A / Trần Thị B / Ông cung cấp / Nguyễn Thị Hồng Hạnh leaked; no generatedDocumentId in preview-session JSON; no /documents/:id navigation; no 'Lịch sử xử lý' link in standalone; no console errors. Existing 57 evidence (37 curated + 20 batch 3) is preserved. No DB rows, no schema migration, no source/normalized/locked/compiled contract mutation, no auth-state or env-value committed. FIDELITY_COMPLETE_EVIDENCED not claimed: this artifact proves the runtime preview-session DOCX download lifecycle works structurally for the Batch 4 forms — NOT golden layout equivalence (visual / content fidelity remains out of scope for this phase).

## Notes

- Auth path mirrors the production 'Tải DOCX' button: Clerk Bearer token resolved in-page via window.Clerk.session.getToken() and forwarded as Authorization: Bearer to the API origin (localhost:3001).
- Per-form DOCX bytes were independently re-inspected by parse-batch4-docx-download.mjs using PizZip on the .tmp-batch4-docx-download-smoke/<code>.docx artifacts.
- FIDELITY_COMPLETE_EVIDENCED is explicitly NOT claimed. This phase proves the DOCX byte pathway is structurally healthy across 20/20 Batch 4 forms; golden comparison and visual/PDF review remain the next audit phases.
- Temp DOCX bytes live under .tmp-batch4-docx-download-smoke/ — gitignored.
- preview-session response Content-Disposition leak check is enforced: no attachment header on the runtime preview-session POST response (the runtime preview session must not auto-attach the DOCX as a download).

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

| Code | Auth | Demo Clicked | Preview Session | Persisted False | SessionId Prefix | DOCX URL | Download Status | Byte Length | Starts PK | ZIP Open | Content Types | _rels/.rels | document.xml | Placeholder | Stale | No GenDoc | No History | No /documents | Content-Disposition | Failure Class | DOCX Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BM-076 | true | true | 200 | true | true | true | 200 | 99864 | true | true | true | true | true | no | no | yes | yes | yes | no | — | PASS |
| BM-078 | true | true | 200 | true | true | true | 200 | 99127 | true | true | true | true | true | no | no | yes | yes | yes | no | — | PASS |
| BM-080 | true | true | 200 | true | true | true | 200 | 99612 | true | true | true | true | true | no | no | yes | yes | yes | no | — | PASS |
| BM-081 | true | true | 200 | true | true | true | 200 | 60607 | true | true | true | true | true | no | no | yes | yes | yes | no | — | PASS |
| BM-083 | true | true | 200 | true | true | true | 200 | 93215 | true | true | true | true | true | no | no | yes | yes | yes | no | — | PASS |
| BM-084 | true | true | 200 | true | true | true | 200 | 64128 | true | true | true | true | true | no | no | yes | yes | yes | no | — | PASS |
| BM-085 | true | true | 200 | true | true | true | 200 | 99647 | true | true | true | true | true | no | no | yes | yes | yes | no | — | PASS |
| BM-086 | true | true | 200 | true | true | true | 200 | 99524 | true | true | true | true | true | no | no | yes | yes | yes | no | — | PASS |
| BM-087 | true | true | 200 | true | true | true | 200 | 61011 | true | true | true | true | true | no | no | yes | yes | yes | no | — | PASS |
| BM-088 | true | true | 200 | true | true | true | 200 | 52736 | true | true | true | true | true | no | no | yes | yes | yes | no | — | PASS |
| BM-090 | true | true | 200 | true | true | true | 200 | 89841 | true | true | true | true | true | no | no | yes | yes | yes | no | — | PASS |
| BM-091 | true | true | 200 | true | true | true | 200 | 70997 | true | true | true | true | true | no | no | yes | yes | yes | no | — | PASS |
| BM-092 | true | true | 200 | true | true | true | 200 | 63877 | true | true | true | true | true | no | no | yes | yes | yes | no | — | PASS |
| BM-093 | true | true | 200 | true | true | true | 200 | 62442 | true | true | true | true | true | no | no | yes | yes | yes | no | — | PASS |
| BM-094 | true | true | 200 | true | true | true | 200 | 59585 | true | true | true | true | true | no | no | yes | yes | yes | no | — | PASS |
| BM-095 | true | true | 200 | true | true | true | 200 | 58271 | true | true | true | true | true | no | no | yes | yes | yes | no | — | PASS |
| BM-096 | true | true | 200 | true | true | true | 200 | 70742 | true | true | true | true | true | no | no | yes | yes | yes | no | — | PASS |
| BM-097 | true | true | 200 | true | true | true | 200 | 117191 | true | true | true | true | true | no | no | yes | yes | yes | no | — | PASS |
| BM-098 | true | true | 200 | true | true | true | 200 | 57885 | true | true | true | true | true | no | no | yes | yes | yes | no | — | PASS |
| BM-100 | true | true | 200 | true | true | true | 200 | 59801 | true | true | true | true | true | no | no | yes | yes | yes | no | — | PASS |

## Failure classification table (preserved for future runs)

- DOCX_URL_MISSING — docxDownloadUrl missing or wrong shape
- DOCX_DOWNLOAD_4XX / DOCX_DOWNLOAD_5XX — download status 4xx/5xx
- DOCX_DOWNLOAD_NOT_BINARY — content-type JSON/HTML instead of DOCX
- DOCX_DOWNLOAD_TOO_SMALL — buffer <= 5KB
- DOCX_NOT_ZIP — first two bytes are not 'PK'
- DOCX_MISSING_CONTENT_TYPES — [Content_Types].xml missing
- DOCX_MISSING_RELS — _rels/.rels missing
- DOCX_MISSING_DOCUMENT_XML — word/document.xml missing
- DOCX_PLACEHOLDER_LEAK — {{ }} undefined [object Object] in document.xml
- DOCX_STALE_TOKEN_LEAK — Nguyễn Văn A / Trần Thị B / Ông cung cấp / Nguyễn Thị Hồng Hạnh leaked
- PREVIEW_SESSION_BINARY_PK — preview-session response body starts with PK
- PREVIEW_SESSION_NOT_JSON — preview-session response did not parse as JSON
- PREVIEW_RESPONSE_4XX_OR_5XX — preview-session status not 2xx
- PREVIEW_CONTENT_TYPE_INVALID — preview-session content-type non-JSON
- PREVIEW_SESSION_CONTENT_DISPOSITION_LEAK — preview-session response carries Content-Disposition: attachment
- PERSISTED_TRUE — preview-session persisted=true
- SESSION_ID_PREFIX_INVALID — sessionId not runtime_preview_
- GENERATED_DOCUMENT_ID_LEAK — generatedDocumentId in JSON
- HISTORY_LINK_LEAK — 'Lịch sử xử lý' rendered in standalone
- DOCUMENTS_ROUTE_LEAK — page navigated to /documents/...
- AUTH_FAIL — bounced to /sign-in or /sign-up
- ROUTE_RENDER_FAIL — title/sections/inputs missing
- PREVIEW_SESSION_FAIL — preview-session POST did not 2xx
- PREVIEW_BUTTON_MISSING — 'Xem trước bản in' not visible
- DEMO_BUTTON_MISSING — 'Dữ liệu demo' not visible
- PREVIEW_REQUEST_TIMEOUT — POST preview-session > 30s
- THROTTLED_TRANSIENT — request timed out (rerun target)
- CONSOLE_ERRORS — pageerror / unhandled exception
- UNKNOWN — any other failure

## Remaining risks

- Batch 4 machine-checkable fidelity not run
- Batch 4 visual/PDF review not run
- Existing 37 + Batch 3 still require visual/PDF review before fidelityComplete
- Batch 4 will require machine-checkable fidelity, then visual/PDF/human review before fidelityComplete
- FormFlight runtimeReady allowlist remains BM-001 + BM-171 only (not promoted)
- strict audit-213 PASS remains 2 by design
- FIDELITY_COMPLETE_EVIDENCED not claimed — this proves structural DOCX-package validity only
