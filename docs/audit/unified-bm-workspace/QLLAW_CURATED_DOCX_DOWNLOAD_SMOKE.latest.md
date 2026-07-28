# QLLAW Curated 37 DOCX Download Smoke — latest

> **Generated**: 2026-07-09T17:26:42.496Z
> **STATUS**: PASS
> **STATUS_NOTE**: Authenticated DOCX download smoke passed for all 37/37 curated forms. Each form: POST preview-session returned application/json (persisted=false, sessionId prefixed runtime_preview_, docxDownloadUrl present); explicit authenticated GET against the captured docxDownloadUrl returned 200 with content-type application/vnd.openxmlformats-officedocument.wordprocessingml.document; downloaded buffer started with PK (37/37 independently re-confirmed by the audit script on .tmp-docx-download-smoke/<code>.docx); PizZip opens the package as a valid DOCX ZIP for every form; [Content_Types].xml present in every package; word/document.xml present in every package; no placeholder leaks {{ / }} / undefined / null / [object Object]; no stale demo tokens Nguyễn Văn A / Trần Thị B / Ông cung cấp / Nguyễn Thị Hồng Hạnh leaked; no generatedDocumentId in preview-session JSON; no /documents/:id navigation; no 'Lịch sử xử lý' link in standalone; no console errors. No DB rows, no schema migration, no source/normalized/locked/compiled contract mutation, no auth-state or env-value committed. FIDELITY_COMPLETE_EVIDENCED not claimed: this artifact proves the runtime preview-session lifecycle can produce a structurally valid DOCX package — NOT golden layout equivalence (visual / content fidelity remains out of scope for this phase).
> **SOURCE_RENDER_STATUS**: PASS
> **BROWSER_VISIBILITY_STATUS**: PASS
> **DEMO_CLICK_STATUS**: PASS
> **PREVIEW_CLICK_STATUS**: PASS
> **DOCX_DOWNLOAD_STATUS**: PASS
> **FIDELITY_COMPLETE_CLAIMED**: false
> **Total curated codes**: 37
> **Forms DOCX-downloaded**: 37
> **Forms DOCX-passed**: 37
> **Forms DOCX-failed**: 0
> **Binary PK passes**: 37
> **ZIP open passes**: 37
> **Content Types present**: 37
> **word/document.xml present**: 37
> **Placeholder leaks**: 0
> **Stale token leaks**: 0
> **Generated document leaks**: 0
> **History link leaks**: 0
> **Documents route leaks**: 0
> **Auth strategy**: clerk_ticket_storage_state
> **qlv_session used for web route**: false
> **Playwright storage state committed**: false
> **Env values logged**: false

## Counts

| Metric | Count |
|---|---|
| Total curated codes | 37 |
| Forms DOCX-downloaded | 37 |
| Forms DOCX-passed | 37 |
| Forms DOCX-failed | 0 |
| Binary PK passes | 37 |
| ZIP open passes | 37 |
| [Content_Types].xml present | 37 |
| word/document.xml present | 37 |
| Placeholder leaks | 0 |
| Stale token leaks | 0 |
| Generated document leaks | 0 |
| History link leaks | 0 |
| Documents route leaks | 0 |

## Per-form DOCX results

| Code | Preview Session | Persisted False | DOCX URL | Download Status | Byte Length | Starts PK | ZIP Open | Content Types | document.xml | Placeholder | Stale | No GenDoc | No History | No /documents | Failure Class | DOCX Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BM-001 | 200 | true | true | 200 | 22278 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-005 | 200 | true | true | 200 | 88279 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-006 | 200 | true | true | 200 | 100566 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-007 | 200 | true | true | 200 | 128948 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-008 | 200 | true | true | 200 | 104240 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-009 | 200 | true | true | 200 | 88089 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-010 | 200 | true | true | 200 | 87930 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-011 | 200 | true | true | 200 | 86469 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-012 | 200 | true | true | 200 | 120586 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-014 | 200 | true | true | 200 | 96290 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-015 | 200 | true | true | 200 | 127826 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-017 | 200 | true | true | 200 | 83805 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-018 | 200 | true | true | 200 | 85870 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-019 | 200 | true | true | 200 | 110755 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-020 | 200 | true | true | 200 | 123809 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-022 | 200 | true | true | 200 | 52632 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-023 | 200 | true | true | 200 | 85711 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-030 | 200 | true | true | 200 | 87004 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-031 | 200 | true | true | 200 | 83936 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-033 | 200 | true | true | 200 | 90477 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-035 | 200 | true | true | 200 | 59235 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-036 | 200 | true | true | 200 | 78060 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-037 | 200 | true | true | 200 | 98016 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-038 | 200 | true | true | 200 | 103938 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-040 | 200 | true | true | 200 | 101528 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-042 | 200 | true | true | 200 | 92427 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-043 | 200 | true | true | 200 | 98219 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-044 | 200 | true | true | 200 | 101692 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-045 | 200 | true | true | 200 | 95380 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-046 | 200 | true | true | 200 | 100476 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-047 | 200 | true | true | 200 | 126677 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-048 | 200 | true | true | 200 | 71032 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-052 | 200 | true | true | 200 | 68609 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-053 | 200 | true | true | 200 | 145420 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-054 | 200 | true | true | 200 | 86562 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-070 | 200 | true | true | 200 | 120458 | true | true | true | true | false | false | true | true | true | — | PASS |
| BM-171 | 200 | true | true | 200 | 21574 | true | true | true | true | false | false | true | true | true | — | PASS |

## Status rationale

Authenticated DOCX download smoke passed for all 37/37 curated forms. Each form: POST preview-session returned application/json (persisted=false, sessionId prefixed runtime_preview_, docxDownloadUrl present); explicit authenticated GET against the captured docxDownloadUrl returned 200 with content-type application/vnd.openxmlformats-officedocument.wordprocessingml.document; downloaded buffer started with PK (37/37 independently re-confirmed by the audit script on .tmp-docx-download-smoke/<code>.docx); PizZip opens the package as a valid DOCX ZIP for every form; [Content_Types].xml present in every package; word/document.xml present in every package; no placeholder leaks {{ / }} / undefined / null / [object Object]; no stale demo tokens Nguyễn Văn A / Trần Thị B / Ông cung cấp / Nguyễn Thị Hồng Hạnh leaked; no generatedDocumentId in preview-session JSON; no /documents/:id navigation; no 'Lịch sử xử lý' link in standalone; no console errors. No DB rows, no schema migration, no source/normalized/locked/compiled contract mutation, no auth-state or env-value committed. FIDELITY_COMPLETE_EVIDENCED not claimed: this artifact proves the runtime preview-session lifecycle can produce a structurally valid DOCX package — NOT golden layout equivalence (visual / content fidelity remains out of scope for this phase).

## Failure classification table (preserved for future runs)

- DOCX_URL_MISSING — docxDownloadUrl missing or wrong shape
- DOCX_DOWNLOAD_4XX_OR_5XX — download status outside 2xx
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
- THROTTLED_TRANSIENT — request timed out (rerun target)
- CONSOLE_ERRORS — pageerror / unhandled exception
- UNKNOWN — any other failure

## Remaining risks

- golden / layout fidelity not claimed
- FormFlight runtimeReady allowlist remains BM-001 + BM-171 only (not promoted)
- strict audit-213 PASS remains 2 by design
- FIDELITY_COMPLETE_EVIDENCED not claimed — this proves structural DOCX-package validity only
- DOCX content fidelity (visual / variable rendering) not yet golden-compared
- Temp DOCX bytes live under .tmp-docx-download-smoke/ — gitignored, not part of the audit deliverable
