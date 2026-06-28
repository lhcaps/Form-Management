# CodeGraph Findings — Board Blocker Preservation

**Task:** BM063_CLOSE_AS_HUMAN_REVIEW_BLOCKER_AND_SELECT_NEXT_BM
**Date:** 2026-06-28

---

## Query A: How is LEGAL_REVIEW/BLOCKED_BY_HUMAN_DOCX_REVIEW represented in the board?

From `refresh-213-docx-fidelity-board.mjs`:

- `LANES` array includes `'LEGAL_REVIEW'` as a valid lane.
- `primaryLane()` never assigns LEGAL_REVIEW from source data alone — it requires a `fixCounts.MANUAL_LEGAL_REVIEW` entry.
- `completionStatus()` assigns `NEEDS_REMEDIATION` for all non-VERIFY_ONLY lanes, overwriting any previous blocker state.
- `buildRows()` regenerates all rows fresh from source data — no blocker state persisted.
- `buildSummary()` recomputes lane counts from all rows, so LEGAL_REVIEW count depends on how many rows are assigned that lane.

**Root cause of overwrite issue:** `buildRows()` calls `completionStatus(row)` which sets `NEEDS_REMEDIATION` for all rows where `primaryLane !== 'VERIFY_ONLY'` and `primaryLane !== 'RENDER_FIDELITY'`. Since blockers had `primaryLane` reset to `CONTRACT_REPAIR`, their `completionStatus` became `NEEDS_REMEDIATION` on every refresh.

---

## Query B: Why does refresh-213-docx-fidelity-board.mjs overwrite blocker rows?

**Cause:** The script is a pure generator — it reads source data and produces a snapshot, discarding any manual edits made to `latest.json` between runs.

**Evidence:** `buildRows()` starts from `loadLockedContracts()` + `loadBaselineRows()` + `loadRootCause()`, then applies `primaryLane()`, `completionStatus()`, `nextAction()` logic based on current source data. There is no checkpoint/merge step.

**Implication:** Any row manually edited to `BLOCKED_BY_HUMAN_DOCX_REVIEW` is overwritten on the next refresh. This is a deliberate design decision (deterministic snapshot) that conflicts with the need for durable blocker states.

---

## Query C: Post-refresh vs. generator support — safest pattern?

### Option 1: Post-refresh helper (chosen)
**File:** `scripts/audit/apply-human-review-blockers-to-board.mjs`
- Runs after `refresh-213-docx-fidelity-board.mjs`
- Reads `human-review-blocker.latest.json` files
- Patches `latest.json` and `per-bm.csv`
- Belt-and-suspenders: runs even if the durable generator fix fails
- Not a pure snapshot: has side-effect patching

### Option 2: Durable generator support (now implemented)
**File:** `scripts/audit/refresh-213-docx-fidelity-board.mjs` — `applyHumanReviewBlockerLedgers()`
- Integrated into the generator pipeline
- Called after `buildRows()`, before `buildSummary()`
- Reads `human-review-blocker.latest.json` files dynamically
- Preserves lane counts (summary recomputed from patched rows)
- Excludes blockers from `nextCandidates`

**Recommendation:** Keep both. The generator fix is the primary defense; the helper is the belt-and-suspenders. Future cleanup can consolidate once the pattern stabilizes.

---

## Query D: Where should BM-052/062/063 blocker ledgers be read from?

**Pattern established:**
- `docs/audit/docx-placeholder-renormalization/<BM_CODE>/human-review-blocker.latest.json`
- `docs/audit/docx-placeholder-renormalization/<BM_CODE>/human-review-blocker.latest.md`

Both scripts scan `docs/audit/docx-placeholder-renormalization/BM-*/human-review-blocker.latest.json` — no hardcoded BM list.

---

## Query E: How should next-BM selection exclude blocked BMs?

**Method:** `nextCandidates` filter in `buildBoard()`:

```javascript
.filter((row) =>
  row.primaryLane !== 'VERIFY_ONLY' &&
  row.completionStatus !== 'BLOCKED_BY_HUMAN_DOCX_REVIEW'
)
```

This is durable because:
1. After `applyHumanReviewBlockerLedgers()`, blocked rows have `completionStatus === 'BLOCKED_BY_HUMAN_DOCX_REVIEW'`
2. The filter excludes them from the sorted candidate list
3. Future blocked BMs are automatically excluded when their ledger files are present
