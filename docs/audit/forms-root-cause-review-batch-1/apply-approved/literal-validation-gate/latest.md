# Review Batch 1 — Literal Validation Gate

Generated: 2026-06-25T21:45:13.447Z
Verdict: **FAIL**

## Required Commands (exact literal spec)

| # | Literal Command | Exit | Status | Duration |
|---|----------------|------|--------|---------|
| 1 | `pnpm contract` | 1 | **FAIL** | 309ms |
| 2 | `pnpm contract` | 1 | **FAIL** | 294ms |
| 3 | `pnpm gate:forms:213` | 0 | **PASS** | 348ms |
| 4 | `pnpm audit` | 1 | **FAIL** | 1567ms |
| 5 | `pnpm plan` | 0 | **PASS** | 358ms |
| 6 | `pnpm audit` | 1 | **FAIL** | 1705ms |
| 7 | `pnpm audit` | 1 | **FAIL** | 1128ms |
| 8 | `pnpm --filter @qllaw/form-contracts test` | 0 | **PASS** | 1044ms |
| 9 | `pnpm typecheck` | 0 | **PASS** | 5540ms |

## Issue Delta

| Metric | Baseline | Current | Delta |
|--------|----------|---------|------:|
| totalIssues | 3460 | 3458 | -2 |
| BAD_LABEL | 453 | 451 | -2 |
| UI_VISIBLE_BAD_METADATA | 96 | 94 | -2 |

## Contract Verification

- BM-002 document.documentCode: `"Số văn bản"` ✗
- BM-003 document.documentCode: `"Số văn bản"` ✗

## Decisions Verification — PASS

- Decisions count: 24
- Approved for apply: 2

## Failing Commands

### [1] pnpm contract
Exit code: **1**

```
[stderr]
'contract' is not recognized as an internal or external command,
operable program or batch file.

```

### [2] pnpm contract
Exit code: **1**

```
[stderr]
'contract' is not recognized as an internal or external command,
operable program or batch file.

```

### [4] pnpm audit
Exit code: **1**

```
[stderr]
(empty)
```

### [6] pnpm audit
Exit code: **1**

```
[stderr]
(empty)
```

### [7] pnpm audit
Exit code: **1**

```
[stderr]
(empty)
```

**Verdict: FAIL**
