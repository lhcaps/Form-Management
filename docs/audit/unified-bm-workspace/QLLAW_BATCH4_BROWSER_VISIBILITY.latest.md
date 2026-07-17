# QLLAW Batch 4 Browser Visibility - latest

> **Generated**: 2026-07-10T08:48:51.015Z
> **STATUS**: PASS
> **STATUS_NOTE**: All 20 Batch 4 forms passed authenticated Playwright browser visibility smoke. BM-094, BM-095, BM-096, BM-097 experienced transient connection-refused failures on the main run (classified THROTTLED_TRANSIENT) and passed cleanly on the targeted cooldown rerun (honest merge - rerun evidence preferred). No demo-click / preview-click / DOCX download / fidelity phase was run for Batch 4. Existing 57 evidence remains untouched and valid.
> **SOURCE_RENDER_STATUS**: PASS
> **BROWSER_VISIBILITY_STATUS**: PASS
> **DEMO_CLICK_STATUS**: NOT_RUN for Batch 4
> **PREVIEW_CLICK_STATUS**: NOT_RUN for Batch 4
> **DOCX_DOWNLOAD_STATUS**: NOT_RUN for Batch 4
> **MACHINE_CHECKABLE_FIDELITY_STATUS**: NOT_RUN for Batch 4
> **VISUAL_PDF_FIDELITY_STATUS**: NOT_RUN for Batch 4
> **FIDELITY_COMPLETE_CLAIMED**: false
> **Total forms**: 20
> **Forms visibility smoked**: 20
> **Forms visibility passed**: 20
> **Forms visibility failed**: 0
> **Rerun overrides**: BM-094, BM-095, BM-096, BM-097
> **Auth strategy**: clerk_ticket_storage_state
> **qlvSession used for web route**: false
> **Existing 57 evidence preserved**: YES
> **FormFlight runtimeReady promoted**: 0

## Status rationale

All 20 Batch 4 forms passed authenticated Playwright browser visibility smoke. BM-094, BM-095, BM-096, BM-097 experienced transient connection-refused failures on the main run (classified THROTTLED_TRANSIENT) and passed cleanly on the targeted cooldown rerun (honest merge - rerun evidence preferred). No demo-click / preview-click / DOCX download / fidelity phase was run for Batch 4. Existing 57 evidence remains untouched and valid.

## Notes

- Batch 4 browser visibility smoke ran via tests/e2e/curated-batch4-templates.auth.spec.ts.
- Spec asserts authenticated URL is not sign-in/sign-up, BM code or title visible, at least one h3 section heading visible, at least one input/textarea/select visible, 'Xem trước bản in' button visible, 'Không tìm thấy trang' boundary absent, no fatal console/page errors.
- Spec does NOT click preview, does NOT click demo, does NOT exercise the preview-session API, does NOT download DOCX.
- BM-094, BM-095, BM-096, BM-097 experienced transient connection-refused failures on the main run (THROTTLED_TRANSIENT) and passed cleanly on the targeted cooldown rerun - rerun evidence preferred.
- Existing 37 + Batch 3 (57 total) evidence remains untouched and valid.
- No FIDELITY_COMPLETE_EVIDENCED claim is set.
- FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.
- Demo-click / preview-click / DOCX download / fidelity phases for Batch 4 run in separate follow-up phases.

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

## Per-form batch 4 browser visibility results

| Code | Authenticated | Route 200 | Not 404 | SignIn redirect | Title/Code | Section | Field | Preview button | Console errors | Browser status | Failure class | Duration (ms) | Evidence source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BM-076 | yes | yes | yes | no | yes | yes | yes | yes | 0 | PASS | - | 1405 | main |
| BM-078 | yes | yes | yes | no | yes | yes | yes | yes | 0 | PASS | - | 1359 | main |
| BM-080 | yes | yes | yes | no | yes | yes | yes | yes | 0 | PASS | - | 1409 | main |
| BM-081 | yes | yes | yes | no | yes | yes | yes | yes | 0 | PASS | - | 1384 | main |
| BM-083 | yes | yes | yes | no | yes | yes | yes | yes | 0 | PASS | - | 1872 | main |
| BM-084 | yes | yes | yes | no | yes | yes | yes | yes | 0 | PASS | - | 1379 | main |
| BM-085 | yes | yes | yes | no | yes | yes | yes | yes | 0 | PASS | - | 1377 | main |
| BM-086 | yes | yes | yes | no | yes | yes | yes | yes | 0 | PASS | - | 1365 | main |
| BM-087 | yes | yes | yes | no | yes | yes | yes | yes | 0 | PASS | - | 1358 | main |
| BM-088 | yes | yes | yes | no | yes | yes | yes | yes | 0 | PASS | - | 1333 | main |
| BM-090 | yes | yes | yes | no | yes | yes | yes | yes | 0 | PASS | - | 1404 | main |
| BM-091 | yes | yes | yes | no | yes | yes | yes | yes | 0 | PASS | - | 1395 | main |
| BM-092 | yes | yes | yes | no | yes | yes | yes | yes | 0 | PASS | - | 1379 | main |
| BM-093 | yes | yes | yes | no | yes | yes | yes | yes | 0 | PASS | - | 1363 | main |
| BM-094 | yes | yes | yes | no | yes | yes | yes | yes | 0 | PASS | - | 1566 | rerun |
| BM-095 | yes | yes | yes | no | yes | yes | yes | yes | 0 | PASS | - | 1439 | rerun |
| BM-096 | yes | yes | yes | no | yes | yes | yes | yes | 0 | PASS | - | 1470 | rerun |
| BM-097 | yes | yes | yes | no | yes | yes | yes | yes | 0 | PASS | - | 1455 | rerun |
| BM-098 | yes | yes | yes | no | yes | yes | yes | yes | 0 | PASS | - | 5681 | main |
| BM-100 | yes | yes | yes | no | yes | yes | yes | yes | 0 | PASS | - | 1937 | main |

## Remaining risks

- Batch 4 demo-click not run
- Batch 4 preview-click not run
- Batch 4 DOCX download not run
- Batch 4 fidelity audit not run
- Existing 37 + Batch 3 still require visual/PDF review before fidelityComplete
- FormFlight runtimeReady allowlist remains BM-001 + BM-171 only
- FIDELITY_COMPLETE_EVIDENCED not claimed
