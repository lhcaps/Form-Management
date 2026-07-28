# QLLAW 213 Form Input Linkage Matrix — latest

> **Generated**: 2026-07-07T17:39:34.692Z
> **Total forms**: 1
> **Filtered to**: BM-001

## Counts

| Status | Count |
|---|---|
| INPUT_CONNECTED_PASS | 0 |
| INPUT_CONNECTED_PARTIAL | 0 |
| FIDELITY_PENDING | 0 |
| ROUTE_BLOCKED | 1 |
| CONTRACT_BLOCKED | 0 |
| PREVIEW_BLOCKED | 0 |

## Runtime-ux profiles registered

- Profiles registered: (none)
- Runtime-ready allowlist: BM-001, BM-171
- Form-flight profiles: 0
- Legacy components: 0

> NOTE: `apps/web/src/features/forms-contracts/sample-data.ts` still contains legacy stale tokens (`Nguyễn Văn A`, `Trần Thị B`, etc.) in its `SAMPLE_REGISTRY`. The Phase-4 runtime-ux profile generator removes the runtime dependency on this path, but the file is not deleted to preserve the fall-through heuristic for any form that genuinely lacks a profile.

## Per-form linkage

| Code | Title | Sections | Fields | Required | Profile | Smart | Stale tokens | Status |
|---|---|---:|---:|---:|---|---:|---|---|
| BM-001 | Biên bản tiếp nhận nguồn tin về tội phạm | 6 | 39 | 38 | NO | 13 | Nguyễn Văn A;Trần Thị B;Ông  cung cấp;1980 | ROUTE_BLOCKED |

## Profile issues (fields/keys missing from contract)
- BM-001 (status=ROUTE_BLOCKED)
  - stale tokens in profile: Nguyễn Văn A / Trần Thị B / Ông  cung cấp / 1980
