# QLLAW Remaining Source/Render Candidates - latest

> Generated: 2026-07-10T08:48:53.362Z
> Status: PASS
> Eligible selected: 24
> Rejected (special/canary/blocked): 12

## Inventory

- Total INPUT_CONNECTED_PARTIAL rows: 36
- ELIGIBLE_SOURCE_RENDER: 24
- CANARY_HOLDOUT: 2
- SPECIAL_SKIP: 10
- OTHER_BLOCKED: 0
- MISSING_ARTIFACTS: 0
- CONTRACT_TEMPLATE_AMENDMENT_REQUIRED: 0
- METADATA_UNDEFINED: 0

## Selection Strategy

- Inventory every INPUT_CONNECTED_PARTIAL row from the 213 matrix.
- Hard gate: source DOCX available OR normalized DOCX available (recorded separately).
- Hard gate: normalized DOCX available.
- Hard gate: locked contract available (docs/audit/docx/contracts/locked).
- Hard gate: compiled contract available (docs/audit/docx/compiled-v2).
- Hard gate: runtime UX profile exists AND is registered in apps/web/src/lib/runtime-ux/index.ts.
- Rejection: CANARY_HOLDOUT (BM-024 / BM-130 / BM-200 - curated-runtime-ux-batch canaries).
- Rejection: SPECIAL_SKIP (known special/skipped forms BM-039/041/049/050/051/077/079/082/089/099).
- Rejection: OTHER_BLOCKED (BM-171 already PASS pilot on FormFlight runtimeReady allowlist).
- Rejection: MISSING_ARTIFACTS / CONTRACT_TEMPLATE_AMENDMENT_REQUIRED / METADATA_UNDEFINED surfaced separately with explicit reason.
- No target count is hardcoded. All ELIGIBLE_SOURCE_RENDER forms are selected.
- No DOCX/template/contract/DB/schema mutation is performed by this selector.

## Eligible Candidates

| Code | Source DOCX | Normalized | Locked | Compiled | Profile | Registered |
|---|---|---|---|---|---|---|
| BM-002 | true | true | true | true | true | true |
| BM-003 | true | true | true | true | true | true |
| BM-004 | true | true | true | true | true | true |
| BM-013 | true | true | true | true | true | true |
| BM-182 | true | true | true | true | true | true |
| BM-183 | true | true | true | true | true | true |
| BM-184 | true | true | true | true | true | true |
| BM-185 | true | true | true | true | true | true |
| BM-186 | true | true | true | true | true | true |
| BM-187 | true | true | true | true | true | true |
| BM-188 | true | true | true | true | true | true |
| BM-189 | true | true | true | true | true | true |
| BM-190 | true | true | true | true | true | true |
| BM-191 | true | true | true | true | true | true |
| BM-192 | true | true | true | true | true | true |
| BM-193 | true | true | true | true | true | true |
| BM-194 | true | true | true | true | true | true |
| BM-195 | true | true | true | true | true | true |
| BM-196 | true | true | true | true | true | true |
| BM-197 | true | true | true | true | true | true |
| BM-198 | true | true | true | true | true | true |
| BM-199 | true | true | true | true | true | true |
| BM-201 | true | true | true | true | true | true |
| BM-202 | true | true | true | true | true | true |

## Rejected Candidates

| Code | Class | Reason |
|---|---|---|
| BM-024 | CANARY_HOLDOUT | curated-runtime-ux-batch canary (must remain auto-generated) |
| BM-039 | SPECIAL_SKIP | known special/skipped form |
| BM-041 | SPECIAL_SKIP | known special/skipped form |
| BM-049 | SPECIAL_SKIP | known special/skipped form |
| BM-050 | SPECIAL_SKIP | known special/skipped form |
| BM-051 | SPECIAL_SKIP | known special/skipped form |
| BM-077 | SPECIAL_SKIP | known special/skipped form |
| BM-079 | SPECIAL_SKIP | known special/skipped form |
| BM-082 | SPECIAL_SKIP | known special/skipped form |
| BM-089 | SPECIAL_SKIP | known special/skipped form |
| BM-099 | SPECIAL_SKIP | known special/skipped form |
| BM-200 | CANARY_HOLDOUT | curated-runtime-ux-batch canary (must remain auto-generated) |
