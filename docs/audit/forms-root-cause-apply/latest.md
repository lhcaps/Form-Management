# Forms Root-Cause Apply Report
Generated: 2026-06-27T17:02:35.877Z
Mode: **dry-run**

## Executive Summary

| Metric | Value |
|--------|-------|
| Mode | dry-run |
| Input auto-fix count | 0 |
| Planned mutations | 0 |
| Applied mutations | 0 |
| Skipped | 0 |
| Changed contracts | 0 |

### Safety Checks

| Check | Result |
|-------|--------|
| allAutoFix | PASS |
| allApplySafe | PASS |
| noGenericProposedPaths | PASS |
| noBadProposedLabels | PASS |
| noUnsupportedSources | PASS |
| noPathCollisions | PASS |
| noConflictSkips | PASS |
| noUnsafePathRewrites | PASS |

### Mutations by Action

| Action | Count |
|--------|-------|

## BM-050 Changes
No changes for BM-050 in this batch.

## BM-068 Changes
No changes for BM-068 in this batch.

## Validation Commands

After write mode, run:

```bash
pnpm contract
pnpm audit:forms-root-cause
pnpm plan:forms-root-cause-fixes
pnpm gate:forms:213
pnpm audit:forms-root-cause
pnpm audit:forms-root-cause
pnpm --filter @qllaw/form-contracts test
pnpm typecheck
```

