# QLLAW Batch 4 Demo-Click Smoke — latest

> **Generated**: 2026-07-10T08:48:51.064Z
> **STATUS**: PASS
> **STATUS_NOTE**: All 20 Batch 4 forms passed authenticated Playwright demo-click smoke via tests/e2e/curated-batch4-demo-click.auth.spec.ts. No preview-session, DOCX download, generated-document, /documents/ route, or 'Lịch sử xử lý' leaks. No stale-token or placeholder leaks. No console errors. Existing 57 evidence (37 curated + 20 batch 3) remains untouched.
> **SOURCE_RENDER_STATUS**: PASS
> **BROWSER_VISIBILITY_STATUS**: PASS
> **DEMO_CLICK_STATUS**: PASS
> **PREVIEW_CLICK_STATUS**: NOT_RUN for Batch 4
> **DOCX_DOWNLOAD_STATUS**: NOT_RUN for Batch 4
> **MACHINE_CHECKABLE_FIDELITY_STATUS**: NOT_RUN for Batch 4
> **VISUAL_PDF_FIDELITY_STATUS**: NOT_RUN for Batch 4
> **FIDELITY_COMPLETE_CLAIMED**: false
> **Total forms**: 20
> **Forms demo-clicked**: 20
> **Forms demo-passed**: 20
> **Forms demo-failed**: 0
> **Stale token hits**: 0
> **Rerun codes used**: (none)
> **Auth strategy**: clerk_ticket_storage_state
> **qlv_session used for web route**: false
> **Existing 57 evidence preserved**: YES
> **Placeholder leaks**: 0
> **Generated document leaks**: 0
> **History link leaks**: 0
> **/documents/ route leaks**: 0
> **Preview session leaks**: 0
> **DOCX download leaks**: 0
> **FormFlight runtimeReady promoted**: 0
> **Playwright main stats**: expected=22, unexpected=0, flaky=0, skipped=0, durationMs=49796.017
> **Playwright rerun stats**: not run

## Status rationale

All 20 Batch 4 forms passed authenticated Playwright demo-click smoke via tests/e2e/curated-batch4-demo-click.auth.spec.ts. No preview-session, DOCX download, generated-document, /documents/ route, or 'Lịch sử xử lý' leaks. No stale-token or placeholder leaks. No console errors. Existing 57 evidence (37 curated + 20 batch 3) remains untouched.

## Notes

- Batch 4 demo-click smoke ran via tests/e2e/curated-batch4-demo-click.auth.spec.ts.
- Spec asserts authenticated URL is not sign-in/sign-up, BM code or title visible, at least one h3 section heading visible, at least one input/textarea/select visible, 'Dữ liệu demo' button visible/enabled, at least one field receives non-empty value after demo click, stale tokens absent, fields still editable, 'Xem trước bản in' still visible, 'Không tìm thấy trang' boundary absent, no /documents/ navigation, no generatedDocumentId leak, no 'Lịch sử xử lý' link, no preview-session/DOCX download/generated-document API call leaked, no fatal console/page errors.
- Spec does NOT click 'Xem trước bản in', does NOT call preview-session, does NOT download DOCX, does NOT run fidelity, does NOT curate more forms.
- Existing 37 + Batch 3 (57 total) evidence remains untouched and valid.
- Batch 4 browser visibility evidence remains untouched and valid.
- No FIDELITY_COMPLETE_EVIDENCED claim is set.
- FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.
- Preview-click / DOCX download / fidelity phases for Batch 4 run in separate follow-up phases.

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

## Per-form batch 4 demo-click results

| Code | Auth | Route 200 | Not 404 | SignIn redirect | Demo button | Demo clicked | Changed fields | Placeholder leaks | Stale token leaks | GenDoc leak | History leak | /documents leak | Preview session leak | DOCX download leak | Console errors | Failure class | Duration (ms) | Evidence source | Demo status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BM-076 | yes | yes | yes | no | yes | yes | 1 | 0 | 0 | no | no | no | no | no | 0 | — | 1999 | main | PASS |
| BM-078 | yes | yes | yes | no | yes | yes | 1 | 0 | 0 | no | no | no | no | no | 0 | — | 2009 | main | PASS |
| BM-080 | yes | yes | yes | no | yes | yes | 1 | 0 | 0 | no | no | no | no | no | 0 | — | 2113 | main | PASS |
| BM-081 | yes | yes | yes | no | yes | yes | 1 | 0 | 0 | no | no | no | no | no | 0 | — | 2074 | main | PASS |
| BM-083 | yes | yes | yes | no | yes | yes | 1 | 0 | 0 | no | no | no | no | no | 0 | — | 2026 | main | PASS |
| BM-084 | yes | yes | yes | no | yes | yes | 1 | 0 | 0 | no | no | no | no | no | 0 | — | 2021 | main | PASS |
| BM-085 | yes | yes | yes | no | yes | yes | 1 | 0 | 0 | no | no | no | no | no | 0 | — | 2073 | main | PASS |
| BM-086 | yes | yes | yes | no | yes | yes | 1 | 0 | 0 | no | no | no | no | no | 0 | — | 2025 | main | PASS |
| BM-087 | yes | yes | yes | no | yes | yes | 1 | 0 | 0 | no | no | no | no | no | 0 | — | 2094 | main | PASS |
| BM-088 | yes | yes | yes | no | yes | yes | 1 | 0 | 0 | no | no | no | no | no | 0 | — | 2070 | main | PASS |
| BM-090 | yes | yes | yes | no | yes | yes | 1 | 0 | 0 | no | no | no | no | no | 0 | — | 2044 | main | PASS |
| BM-091 | yes | yes | yes | no | yes | yes | 1 | 0 | 0 | no | no | no | no | no | 0 | — | 2126 | main | PASS |
| BM-092 | yes | yes | yes | no | yes | yes | 1 | 0 | 0 | no | no | no | no | no | 0 | — | 2025 | main | PASS |
| BM-093 | yes | yes | yes | no | yes | yes | 1 | 0 | 0 | no | no | no | no | no | 0 | — | 2002 | main | PASS |
| BM-094 | yes | yes | yes | no | yes | yes | 1 | 0 | 0 | no | no | no | no | no | 0 | — | 2104 | main | PASS |
| BM-095 | yes | yes | yes | no | yes | yes | 1 | 0 | 0 | no | no | no | no | no | 0 | — | 2100 | main | PASS |
| BM-096 | yes | yes | yes | no | yes | yes | 1 | 0 | 0 | no | no | no | no | no | 0 | — | 2097 | main | PASS |
| BM-097 | yes | yes | yes | no | yes | yes | 1 | 0 | 0 | no | no | no | no | no | 0 | — | 2075 | main | PASS |
| BM-098 | yes | yes | yes | no | yes | yes | 1 | 0 | 0 | no | no | no | no | no | 0 | — | 2070 | main | PASS |
| BM-100 | yes | yes | yes | no | yes | yes | 1 | 0 | 0 | no | no | no | no | no | 0 | — | 2025 | main | PASS |

## Remaining risks

- Batch 4 preview-click not run
- Batch 4 DOCX download not run
- Batch 4 fidelity audit not run
- Existing 37 + Batch 3 still require visual/PDF review before fidelityComplete
- Batch 4 will require preview-click, DOCX download, machine-checkable fidelity, then visual/PDF/human review before fidelityComplete
- FormFlight runtimeReady allowlist remains BM-001 + BM-171 only
- FIDELITY_COMPLETE_EVIDENCED not claimed
- strict audit-213 PASS remains 2 by design
