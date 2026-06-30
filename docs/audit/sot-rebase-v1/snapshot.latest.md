# SOT_REBASE_V1 — Snapshot

**Generated:** 2026-06-28T17:38:00.000Z
**Branch:** `fix/documents-canonical-render-payload-snapshot` [ahead 1]

## Worktree Changes

| Category | Files |
|---|---|
| `compiled-v2/*.compiled.json` | all 213 (pre-existing diff) |
| `contracts/locked/*.contract.locked.json` | all 213 (pre-existing diff) |
| `normalized-docx/` | 6 files (pre-existing diff) |
| `legacy-renderer-capabilities.generated.ts` | 1 file (pre-existing diff) |
| `audit docs (new)` | sot-rebase-v1 + compiled-v2-reconciliation |

## Pre-Existing Audit State

| Command | Result | Note |
|---|---|---|
| `audit-contract-sync` | 213 matched / 0 missing / 0 stale | **FALSE GREEN** — compares compiled-v2 vs DB only |
| `refresh-213-docx-fidelity-board` | 213 rows, 1469 root-cause issues, 22 repair required | Runtime fidelity only |
| `render-fidelity-gate BM-063` | FAIL | Stale compiled-v2 binding |
| `render-fidelity-gate BM-066` | FAIL | Stale compiled-v2 binding |

## SOT_REBASE_V1 Audit Results

| Metric | Value |
|---|---|
| Total BMs | 213 |
| Total issues | 4,500 |
| CRITICAL | 3 |
| HIGH | 2,734 |
| MEDIUM | 1,763 |

## Classification Distribution

| Classification | BMs |
|---|---|
| `COMPILED_V2_STALE_VS_LOCKED` | 2 (BM-063, BM-066) |
| `LOCKED_CONTRACT_EVIDENCE_INCONSISTENT` | 203 |
| `LOCKED_CONTRACT_STRUCTURALLY_MATCHED` | 8 |
