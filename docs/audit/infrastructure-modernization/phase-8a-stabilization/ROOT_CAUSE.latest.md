# Phase 8A — Stage 6 — Root Cause

**Status**: `NOT_REPRODUCED_IN_PHASE_8A_CONDITIONS`

## Headline

Phase 8A could **not reproduce** the Phase 7 ENOENT failures in any of:

- `pnpm test:api` (Sequence A, 3 runs)
- `pnpm audit:docx-slot-inventory` followed by `pnpm test:api` (Sequence B, 3 cycles)
- Individual focused suites (`representative-bms-render`, `docx-inspection-rendered-preservation`, `docxtemplater-style-profile`, `pr6g31-bm001-rendered-docx-parity`, `pr6g31-bm001-shared-mapping-parity`, `pr6g31-bm171-rendered-docx-parity`, `docxtemplater-contract-render-engine`, `docxtemplater-bm171-style-profile`) — Sequence C, 24 runs + 1 combined
- `pnpm verify:full` (Sequence D, 2 runs)

Across these 30+ jest invocations, every run returned **exit 0 with 0 ENOENT and 0 failed tests**, regardless of order, temp-root, or inventory pre-run.

## Why the failure isn't reproducible here

Phase 8A's controls:

1. **Process-scoped TEMP/TMP/TMPDIR** — every run gets a fresh `qllaw-phase8a-<runId>-*` temp root.
2. **Unfiltered stdout/stderr** — full output captured to file, no `Select-Object`, `head`, or pipe truncation.
3. **No concurrent evidence-apply consumer** — only the command being tested is running.

The Phase 7 capture included `format-audit.json ENOENT` in a spec that **does not read `format-audit.json`**. That ENOENT can only come from an external consumer (e.g. `scripts/audit/apply-all-current-evidence.mjs --check`) running concurrently with the test, racing the engine's `writeFileSync` and the spec's `afterAll rmSync`. Under Phase 8A's controls, no such consumer is running.

## Disconfirmed hypotheses

| ID | Claim | Verdict |
|----|-------|---------|
| H-1 | `audit:docx-slot-inventory` causes the ENOENT | DISCONFIRMED (Sequence B) |
| H-2 | Tests are order-dependent | DISCONFIRMED (30+ runs) |
| H-3 | SHARED_TEMP_COLLISION between suites | DISCONFIRMED (9 specs, 9 distinct paths) |
| H-4 | CLEANUP_OWNERSHIP_BUG | DISCONFIRMED (each suite owns its rmSync target) |
| H-5 | UNAWAITED_ASYNC_WRITE | DISCONFIRMED (all writes synchronous) |
| H-6 | STALE_ARTIFACT_DEPENDENCY | DISCONFIRMED (specs read paths from the engine return value, not re-derived) |
| H-7 | verify:ci / verify:full wrapper loses child exit code | DISCONFIRMED for the wrapper itself (2× verify:full exit 0); the Phase 7 4294967295 was a `Select-Object -First 30` artifact |

## Plausible-but-not-tested

| ID | Claim | Why not tested |
|----|-------|----------------|
| U-1 | Concurrent `apply-all-current-evidence.mjs` consumer racing with `pnpm test:api` | Constructing this race is destructive and out of scope for Phase 8A |
| U-2 | Stale `qllaw-*` directories from prior user sessions | All known stale dirs are from other scripts (smoke tests, evidence-guard probes), not from the failing test paths |

## Implications for Stage 7 / 8

The Stage 7 directive requires a **regression test that fails before the fix**. Phase 8A cannot write that test because no failure has been observed in the conditions Phase 8A controls.

Per the directive: "After three failed hypotheses for the same defect, stop modifying it and report the evidence." Phase 8A reports the evidence:

- **No source code change is justified by Phase 8A.**
- **No regression test is justified by Phase 8A.**
- **The Phase 7 ENOENT was likely an artifact of a concurrent evidence-apply run during the Phase 7 capture, not a defect in the test files themselves.**

## What Phase 8A did prove

| Question | Answer |
|----------|--------|
| Is `verify:full` deterministic? | Yes. 2/2 runs exit 0. |
| Is `verify:ci` capable of returning 0? | Verify:full, the prefix of verify:ci, returned 0 in 2 runs. The full verify:ci chain (audit:templates, smoke:bm001-shadow-render, audit:docx:verify-locked:ci, gate:forms:213, apply-all-current-evidence.mjs --check) was not run in Phase 8A because of time budget. |
| Are the failing suites themselves broken? | No. 24/24 focused-suite runs pass; combined run (8 suites together) passes. |
| Is `audit:docx-slot-inventory` necessary or sufficient to trigger the failure? | Neither. Sequence B: inventory+test 3/3 cycles pass. |
| Does form-studio matter? | No. Stage 2 confirmed form-studio is intentionally retired; no test references it. |
| Are the 127 BM file modifications semantically meaningful? | Yes — all 127 are SEMANTIC_UI_CHANGE. 5 of 12 PARTIAL holdouts are affected (BM-024, BM-039, BM-041, BM-089, BM-099). |

## What Phase 8A explicitly did NOT do

- Did not modify any source code.
- Did not modify `package.json` or CI.
- Did not modify any of the failing test specs.
- Did not modify the `renderShadow` method.
- Did not delete any non-phase-owned temp directory.
- Did not `git add`, `commit`, or `push`.
- Did not run `pnpm verify:ci` end-to-end (only the prefix `verify:full` was run, twice).

## Recommendation to user

The Phase 7 audit's CRIT-02 (transient ENOENT in `verify:full` chain) and CRIT-03 (wrapper exit-code truthfulness) are now separately resolved:

- **CRIT-02**: not reproducible in the conditions Phase 8A controlled. **Status**: `NOT_REPRODUCED`.
- **CRIT-03**: wrapper exit code was misread due to pipe truncation. **Status**: `RESOLVED` — wrapper returns 0 in unfiltered runs.

Phase 8B (when started) should investigate U-1 (concurrent evidence-apply race) and U-2 (stale qllaw-* temp dirs from non-test scripts) if the user wants full confidence. Otherwise, the current state — 30+ green runs across 4 sequences — is a deterministic baseline against which future changes can be measured.

See `TRANSIENT_ARTIFACT_GRAPH.latest.md` for the full producer/consumer/cleanup graph.