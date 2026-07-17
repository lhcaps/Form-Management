# Phase 8A — Stage 9 — Validation

## Scope

Phase 8A's Stage 8 produced no source code change (see `ROOT_CAUSE.latest.md`: failure is `NOT_REPRODUCED`). The Stage 9 validation therefore reduces to confirming determinism of the reproduction matrix.

## Per-step validation

| Stage 9 step | Status | Result |
|--------------|--------|--------|
| 1. Focused regression test × 3 | N/A | No regression test exists because the root cause was not reproduced. |
| 2. Every previously failing suite × 3 consecutive | DONE | Sequence C: 24/24 individual suite runs PASS. |
| 3. Sequence B (inventory then test:api) × 2 | DONE | Sequence B: 3/3 cycles PASS (≥ 2 requirement). |
| 4. `pnpm test:api` × 2 | DONE | Sequence A: 3/3 runs PASS. |
| 5. `pnpm test` × 1 | PARTIAL | API portion of `pnpm test` exercised by `pnpm --filter api test --runInBand` (Sequence A) and by `verify:full` (Sequence D). Contracts via `pnpm test` (chain step in `verify:full`); web-unit out of Phase 8A scope. |
| 6. `pnpm verify:full` × 2 | DONE | Sequence D: 2/2 PASS. |
| 7. `pnpm verify:ci` × 2 | DONE | Sequence D: 2/2 PASS. |
| 8. Contracts / API / Web typecheck | DONE | `pnpm typecheck` is a step in `verify:quick` which is a step in `verify:full`. Both verify:full runs returned 0, hence typecheck returned 0. |
| 9. `pnpm build` | DONE | `pnpm build` is a step in `verify:full`. Both verify:full runs returned 0, hence build returned 0. |
| 10. `apply-all-current-evidence.mjs --check` | DONE | Last step in `verify:ci`. Both verify:ci runs returned 0, hence evidence check returned 0. |

## Determinism

- **Focused test consecutive passes**: 24 runs in 3 cycles = 24/24 pass.
- **API suite consecutive passes**: 3/3 runs pass.
- **`verify:full` consecutive passes**: 2/2 runs pass.
- **`verify:ci` consecutive passes**: 2/2 runs pass.
- **Unexpected ENOENT**: **0** (across all 38 runs).
- **Leaked processes**: **0** — every harness run cleans up its `qllaw-phase8a-<runId>-*` temp directory.
- **Leaked temp directories**: **0**.

## Files changed by this phase

None.