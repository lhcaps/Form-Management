# QLLAW Curated 37 Demo-Click Smoke — latest

> **Generated**: 2026-07-09T23:31:18.025Z
> **STATUS**: PASS
> **STATUS_NOTE**: Authenticated demo-click smoke passed for all 37 curated forms. 37/37 demo-clicked forms populated demo values without stale tokens, kept fields editable, and kept the preview button visible. BM-001 demo-click passed (preview-session POST bug remains out of scope).
> **SOURCE_RENDER_STATUS**: PASS
> **BROWSER_VISIBILITY_STATUS**: PASS
> **DEMO_CLICK_STATUS**: PASS
> **PREVIEW_CLICK_STATUS**: KNOWN_FAIL_BM001
> **FIDELITY_COMPLETE_CLAIMED**: false
> **Total curated codes**: 37
> **Forms demo-clicked**: 37
> **Forms demo-passed**: 37
> **Forms demo-failed**: 0
> **Stale token hits**: 0
> **Auth strategy**: clerk_ticket_storage_state
> **qlv_session used for web route**: false
> **Playwright storage state committed**: false
> **Env values logged**: false

## Counts

| Metric | Count |
|---|---|
| Total curated codes | 37 |
| Forms demo-clicked | 37 |
| Forms demo-passed | 37 |
| Forms demo-failed | 0 |
| Stale token hits | 0 |

## Per-form demo-click results

| Code | Auth | Demo Button Visible | Demo Clicked | Meaningful Value | Changed Field Count | Stale Tokens Absent | Fields Editable | Preview Button Still Visible | Console Errors | Failure Class | Demo Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| BM-005 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-014 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-015 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-022 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-035 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-006 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-007 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-008 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-009 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-010 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-011 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-012 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-017 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-018 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-019 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-020 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-023 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-030 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-031 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-033 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-036 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-037 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-038 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-040 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-042 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-043 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-044 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-045 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-046 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-047 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-048 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-052 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-053 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-054 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-070 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-001 | true | true | true | true | null | true | true | true | 0 | — | PASS |
| BM-171 | true | true | true | true | null | true | true | true | 0 | — | PASS |

## Status rationale

Authenticated demo-click smoke passed for all 37 curated forms. 37/37 demo-clicked forms populated demo values without stale tokens, kept fields editable, and kept the preview button visible. BM-001 demo-click passed (preview-session POST bug remains out of scope).

## Remaining risks

- preview-click evidence blocked by known BM-001 preview-session POST bug (out of scope)
- FormFlight runtimeReady allowlist remains BM-001 + BM-171 only (not promoted)
- FIDELITY_COMPLETE_EVIDENCED not claimed
- strict audit-213 PASS remains 2 by design
