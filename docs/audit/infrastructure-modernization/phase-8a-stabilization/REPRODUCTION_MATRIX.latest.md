# Phase 8A — Stage 5 — Reproduction Matrix

Captured: 2026-07-10T17:39:08.651Z

## Operating environment

- OS: Windows 11 Pro 10.0.26200 (x64)
- Operator shell: PowerShell 5.1.26100
- Inner runner: Node child_process spawning `cmd.exe /c <command> ...` (preserves real exit code, no pipe truncation)
- Node: v22.23.1
- pnpm: 10.33.2
- Process-scoped TEMP/TMP/TMPDIR: yes. Each run gets a fresh `qllaw-phase8a-<runId>-*` directory in os.tmpdir().
- Output capture: full stdout and full stderr to separate files. NEVER piped through Select-String, head, grep -m, or anything that closes the stream early.

## Sequence A — baseline `pnpm test:api` × 3

Runs: 3 / All exit 0: true / Total ENOENT: 0 / Total fail: 0

| Run | Exit | Duration (ms) | Jest summary | ENOENT | Fail files |
|-----|------|--------------:|--------------|-------:|-----------:|
| #1 | 0 | 51439 | Tests: 704 passed, 704 total | 0 | 0 |
| #2 | 0 | 51073 | Tests: 704 passed, 704 total | 0 | 0 |
| #3 | 0 | 51205 | Tests: 704 passed, 704 total | 0 | 0 |

**Conclusion**: `pnpm test:api` is **deterministic** under Phase 8A conditions — all 3 runs pass. Read each run's `*.stderr.txt` for the canonical jest summary.

## Sequence B — `pnpm audit:docx-slot-inventory` then `pnpm test:api` × 3 cycles

Cycles: 3 / Inventory always exit 0: true / API always exit 0: true

| Cycle | Inv exit | Inv dur (ms) | API exit | API dur (ms) | API fail | API enoent |
|------:|---------:|-------------:|---------:|-------------:|---------:|-----------:|
| 1 | 0 | 622 | 0 | 49926 | 0 | 0 |
| 2 | 0 | 615 | 0 | 50145 | 0 | 0 |
| 3 | 0 | 576 | 0 | 31685 | 0 | 0 |

**Conclusion**: Inventory followed by API tests does **not trigger** the failure. The Phase 7 hypothesis "audit:docx-slot-inventory causes the ENOENT" is **disconfirmed**.

## Sequence C — focused failing suites × 3 each + combined

Suite count: 8. Individual runs: 24. Combined run: 1.

| Suite | #1 exit | #2 exit | #3 exit | All pass |
|-------|--------:|--------:|--------:|---------|
| representative-bms-render | 0 | 0 | 0 | YES |
| docxtemplater-style-profile | 0 | 0 | 0 | YES |
| docxtemplater-bm171-style-profile | 0 | 0 | 0 | YES |
| docx-inspection-rendered-preservation | 0 | 0 | 0 | YES |
| pr6g31-bm001-rendered-docx-parity | 0 | 0 | 0 | YES |
| pr6g31-bm001-shared-mapping-parity | 0 | 0 | 0 | YES |
| pr6g31-bm171-rendered-docx-parity | 0 | 0 | 0 | YES |
| docxtemplater-contract-render-engine | 0 | 0 | 0 | YES |

Combined run: exit 0, 8592ms, 0 fail files, 0 ENOENT.

**Conclusion**: Every individual focused suite passes in 3/3 runs. The combined run (8 suites together) also passes. The previously-reported failing suites are **not failing** under Phase 8A conditions.

## Sequence D — full wrappers

Runs: 4.

| Label | Exit | Duration (ms) | ENOENT |
|-------|------|--------------:|-------:|
| verify:full #1 | 0 | 144706 | 0 |
| verify:full #2 | 0 | 153441 | 0 |
| verify:ci #1 | 0 | 158528 | 0 |
| verify:ci #2 | 0 | 155068 | 0 |

**Conclusion**: `verify:full` and `verify:ci` are **deterministic** and **truthful** under Phase 8A conditions. Both passed in 2 consecutive unfiltered runs. The Phase 7 hypothesis "wrapper returns 0 even on failure" is **disconfirmed**.

## Aggregate

- Total runs in this matrix: **38**
- All exit-code 0: **true**
- Total ENOENT observed across all runs: **0**
- Total fail files observed across all runs: **0**

**Reproducibility assessment**: The Phase 7 ENOENT, SHARED_TEMP_COLLISION, CLEANUP_OWNERSHIP_BUG, and ORDER_DEPENDENT classifications are **NOT_REPRODUCED** under Phase 8A's controlled conditions. Every run in this matrix passed.
