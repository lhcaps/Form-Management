# Forms Root-Cause Apply Report
Generated: 2026-06-25T17:50:55.839Z
Mode: **write**

## Executive Summary

| Metric | Value |
|--------|-------|
| Mode | write |
| Input auto-fix count | 72 |
| Planned mutations | 0 |
| Applied mutations | 0 |
| Skipped | 72 |
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

### Skipped Items

| Reason Code | Count |
|-------------|-------|
| SKIPPED_CONFLICTING_MUTATIONS | 66 |
| SKIPPED_PATH_COLLISION | 6 |

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

## Recommended Next Task

**FORMS_ROOT_CAUSE_REVIEW_BATCH_1**: After write, re-run audit and plan to determine remaining auto-fix candidates. If near 0, proceed to batch review.
